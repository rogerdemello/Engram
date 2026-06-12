import "server-only";
import { getMemwal } from "./memwal";
import { classify } from "./classify";
import { isAuthorized } from "./consent";
import { appAddress, serverEnv } from "./env";
import { addMemories } from "./store";
import { APPS } from "../constants";
import type { Memory, Receipt } from "../types";

/** Namespace owned by each app. */
const NS: Record<string, string> = { chat: APPS.chat.namespace, meal: APPS.meal.namespace };

/**
 * Capture: extract discrete facts from a piece of text, store each on Walrus
 * via MemWal (encrypted), classify sensitivity, and index it.
 *
 * Uses MemWal's `analyzeAndWait` which extracts facts and waits until each is
 * stored, returning the Walrus blob id per fact.
 */
export async function captureMemories(appId: string, text: string): Promise<Memory[]> {
  const namespace = NS[appId] ?? "chat";
  const owner = serverEnv().SUI_ADDRESS;
  const memwal = getMemwal(namespace);

  const result = await memwal.analyzeAndWait(text, { namespace }, { timeoutMs: 90_000 });
  const createdAt = new Date().toISOString();

  // facts[] carry the text; results[] carry the Walrus blob_id — join by id.
  const blobById = new Map(result.results.map((r) => [r.id, r]));

  const memories: Memory[] = result.facts
    .map((f) => {
      const res = blobById.get(f.id);
      if (!res?.blob_id || res.status !== "done") return null;
      const s = classify(f.text);
      return {
        id: f.id,
        blobId: res.blob_id,
        text: f.text,
        namespace,
        sealed: true,
        sensitive: s.sensitive,
        sensitivityLabel: s.label,
        owner,
        createdAt,
      } as Memory;
    })
    .filter((m): m is Memory => m !== null);

  addMemories(memories);
  return memories;
}

/** Directly remember a single statement (no fact extraction). */
export async function rememberMemory(appId: string, text: string): Promise<Memory> {
  const namespace = NS[appId] ?? "chat";
  const owner = serverEnv().SUI_ADDRESS;
  const memwal = getMemwal(namespace);
  const stored = await memwal.rememberAndWait(text, namespace, { timeoutMs: 60_000 });
  const s = classify(text);
  const mem: Memory = {
    id: stored.id,
    blobId: stored.blob_id,
    text,
    namespace,
    sealed: true,
    sensitive: s.sensitive,
    sensitivityLabel: s.label,
    owner,
    createdAt: new Date().toISOString(),
  };
  addMemories([mem]);
  return mem;
}

export interface RecallForAgent {
  receipts: Receipt[];
  /** Namespaces the agent was denied (no on-chain consent). */
  blocked: { namespace: string; reason: string }[];
}

/**
 * Consent-gated recall for an agent.
 *
 * The agent may always read its own namespace. To read ANOTHER app's
 * namespace it must hold a live on-chain grant — otherwise that namespace is
 * skipped and reported as blocked. This is the heart of the demo: revoke the
 * grant on-chain and the meal agent can no longer see the chat memories.
 */
export async function recallForAgent(appId: string, query: string): Promise<RecallForAgent> {
  const ownNs = NS[appId] ?? "chat";
  const app = appAddress(appId);
  const otherNamespaces = Object.values(NS).filter((ns) => ns !== ownNs);

  const allowed: string[] = [ownNs];
  const blocked: { namespace: string; reason: string }[] = [];
  for (const ns of otherNamespaces) {
    if (await isAuthorized(app, ns)) allowed.push(ns);
    else blocked.push({ namespace: ns, reason: "no on-chain consent grant" });
  }

  const receipts: Receipt[] = [];
  for (const ns of allowed) {
    const memwal = getMemwal(ns);
    const res = await memwal.recall({ query, topK: 6, namespace: ns });
    for (const m of res.results) {
      receipts.push({ blobId: m.blob_id, text: m.text, distance: m.distance, namespace: ns });
    }
  }
  // best matches first
  receipts.sort((a, b) => a.distance - b.distance);
  return { receipts: receipts.slice(0, 8), blocked };
}
