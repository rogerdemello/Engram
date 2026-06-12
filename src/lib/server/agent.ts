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
    ...(e.AZURE_OPENAI_BASE_URL
      ? { baseURL: e.AZURE_OPENAI_BASE_URL }
      : { resourceName: e.AZURE_OPENAI_RESOURCE_NAME }),
  });
  return azure(e.AZURE_OPENAI_DEPLOYMENT);
}

const PERSONAS: Record<string, string> = {
  chat:
    "You are Mneme Chat, a warm, concise personal assistant. " +
    "You personalize every answer using the user's verified memories provided to you. " +
    "Prefer using a relevant memory over asking the user to repeat themselves.",
  meal:
    "You are Plate, a meal-planning assistant. " +
    "SAFETY-CRITICAL: you must NEVER suggest a food, ingredient, or recipe that conflicts with the user's dietary restrictions or allergies listed in their memories. " +
    "If a memory states an allergy or diet, treat it as an absolute constraint and briefly note that you honored it.",
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
  });
  return { reply: text.trim() };
}
