import "server-only";
import { createAzure } from "@ai-sdk/azure";
import { generateText } from "ai";
import { serverEnv } from "./env";
import type { Receipt } from "../types";

/** True once Azure OpenAI credentials are present in the environment. */
export function agentConfigured(): boolean {
  const e = serverEnv();
  return Boolean(e.AZURE_OPENAI_API_KEY && (e.AZURE_OPENAI_RESOURCE_NAME || e.AZURE_OPENAI_BASE_URL));
}

function model() {
  const e = serverEnv();
  const azure = createAzure({
    apiKey: e.AZURE_OPENAI_API_KEY,
    apiVersion: e.AZURE_OPENAI_API_VERSION,
    // use the classic /openai/deployments/{name} URL (accepts dated api-versions);
    // the default v1 endpoint only supports api-version=preview.
    useDeploymentBasedUrls: true,
    ...(e.AZURE_OPENAI_BASE_URL
      ? { baseURL: e.AZURE_OPENAI_BASE_URL }
      : { resourceName: e.AZURE_OPENAI_RESOURCE_NAME }),
  });
  // .chat(...) targets /chat/completions; the default azure(id) uses the
  // newer Responses API path, which 404s on standard deployments.
  return azure.chat(e.AZURE_OPENAI_DEPLOYMENT);
}

const PERSONAS: Record<string, string> = {
  chat:
    "You are Engram Chat, a warm, concise personal assistant. " +
    "You personalize every answer using the user's verified memories provided to you. " +
    "Prefer using a relevant memory over asking the user to repeat themselves.",
  meal:
    "You are Plate, a meal-planning assistant. SAFETY IS YOUR #1 PRIORITY. " +
    "The user's memories may list allergies and dietary restrictions. Before you write anything, " +
    "silently check EVERY ingredient — including sauces, oils, garnishes, and toppings — against them. " +
    "NEVER suggest anything that violates a restriction. These are ABSOLUTE constraints, no exceptions:\n" +
    "• A peanut allergy forbids peanuts, peanut butter, peanut oil, groundnuts, and satay.\n" +
    "• A tree-nut allergy forbids almonds, cashews, walnuts, etc. (and their butters/milks/oils).\n" +
    "• Vegan forbids meat, poultry, fish, seafood, dairy, eggs, honey, and gelatin.\n" +
    "After writing your suggestion, re-read it once and confirm it contains nothing the user must avoid. " +
    "Briefly note which restrictions you honored (e.g. 'vegan + peanut-free').",
};

function memoryBlock(memories: Receipt[]): string {
  if (memories.length === 0) return "(no memories available for this request)";
  return memories
    .map((m, i) => `[${i + 1}] (${m.namespace}) ${m.text}`)
    .join("\n");
}

export interface AgentResult {
  reply: string;
}

/**
 * Run an app's agent over the user's recalled memories.
 * `memories` are the receipts the route already recalled (and will show the
 * user); we hand them to the model as grounding context.
 */
export async function runAgent(opts: {
  appId: string;
  message: string;
  memories: Receipt[];
}): Promise<AgentResult> {
  const persona = PERSONAS[opts.appId] ?? PERSONAS.chat;
  const system =
    `${persona}\n\n` +
    `The user's verified memories (retrieved from Walrus for this request):\n` +
    `${memoryBlock(opts.memories)}\n\n` +
    `Answer the user. Keep it natural and brief. Do not list the memories back verbatim unless asked.`;

  const { text } = await generateText({
    model: model(),
    system,
    prompt: opts.message,
    temperature: 0.2, // deterministic adherence to safety constraints
  });
  return { reply: text.trim() };
}
