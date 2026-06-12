"use client";
import type { Memory, Receipt, Grant } from "./types";

async function jpost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `${res.status}`);
  return data as T;
}

async function jget<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `${res.status}`);
  return data as T;
}

/** Tiny client event bus so panels can signal "state changed" without
 *  passing function props across client component boundaries. */
const CHANGED = "mneme:changed";
export function notifyChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CHANGED));
}
export function onChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGED, cb);
  return () => window.removeEventListener(CHANGED, cb);
}

export const api = {
  capture: (appId: string, text: string) =>
    jpost<{ memories: Memory[] }>("/api/capture", { appId, text }),

  agent: (appId: string, message: string, capture = false, registryId?: string) =>
    jpost<{
      reply: string;
      receipts: Receipt[];
      stored: Memory[];
      blocked: { namespace: string; reason: string }[];
    }>("/api/agent", { appId, message, capture, registryId }),

  memories: (namespace?: string) =>
    jget<{ memories: Memory[] }>(
      `/api/memories${namespace ? `?namespace=${namespace}` : ""}`,
    ),

  grants: (registryId?: string) =>
    jget<{
      grants: Grant[];
      owner: string;
      registryId: string;
      packageId: string;
      apps: { chat: string; meal: string };
    }>(`/api/grants${registryId ? `?registryId=${registryId}` : ""}`),

  setGrant: (appId: string, namespace: string, revoke: boolean) =>
    jpost<{ digest: string; revoked: boolean }>("/api/grant", {
      appId,
      namespace,
      revoke,
    }),

  verify: (blobId: string) =>
    jget<{ blobId: string; available: boolean; size?: number; status: number; url: string }>(
      `/api/verify?blobId=${blobId}`,
    ),

  forget: (blobId: string) =>
    jpost<{ forgotten: string }>("/api/forget", { blobId }),
};
