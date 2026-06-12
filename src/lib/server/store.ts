import "server-only";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Memory } from "../types";

/**
 * Lightweight memory index.
 *
 * The *source of truth* for every memory is Walrus (verifiable, encrypted).
 * MemWal has no "list all" — recall is semantic search — so we keep a small
 * local index of metadata (blobId, text, namespace, sensitivity) to render
 * the inspector. Each entry maps to a real, independently-verifiable blob.
 *
 * Persisted to data/memories.json for single-server / local demo runs, with
 * an in-memory cache so it also works on ephemeral filesystems.
 */
const DATA_DIR = join(process.cwd(), "data");
const FILE = join(DATA_DIR, "memories.json");
const FORGET_FILE = join(DATA_DIR, "forgotten.json");

let cache: Memory[] | null = null;
let forgotten: Set<string> | null = null;

function load(): Memory[] {
  if (cache) return cache;
  try {
    if (existsSync(FILE)) {
      cache = JSON.parse(readFileSync(FILE, "utf8")) as Memory[];
      return cache;
    }
  } catch {
    /* fall through to empty */
  }
  cache = [];
  return cache;
}

function persist(list: Memory[]) {
  cache = list;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(list, null, 2));
  } catch {
    /* ephemeral fs (e.g. serverless) — in-memory cache still serves the request */
  }
}

function loadForgotten(): Set<string> {
  if (forgotten) return forgotten;
  try {
    if (existsSync(FORGET_FILE)) {
      forgotten = new Set(JSON.parse(readFileSync(FORGET_FILE, "utf8")) as string[]);
      return forgotten;
    }
  } catch {
    /* ignore */
  }
  forgotten = new Set();
  return forgotten;
}

function persistForgotten(set: Set<string>) {
  forgotten = set;
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(FORGET_FILE, JSON.stringify([...set]));
  } catch {
    /* ephemeral fs */
  }
}

/** blobIds the user has chosen to forget (excluded from inspector + recall). */
export function forgottenSet(): Set<string> {
  return loadForgotten();
}

export function listMemories(namespace?: string): Memory[] {
  const all = load();
  const gone = loadForgotten();
  const filtered = all.filter(
    (m) => !gone.has(m.blobId) && (!namespace || m.namespace === namespace),
  );
  // newest first
  return [...filtered].reverse();
}

export function addMemories(items: Memory[]): Memory[] {
  const all = load();
  // de-dupe by blobId
  const seen = new Set(all.map((m) => m.blobId));
  const fresh = items.filter((m) => m.blobId && !seen.has(m.blobId));
  persist([...all, ...fresh]);
  return fresh;
}

/** Tombstone a memory: the agent stops using it and it leaves the inspector.
 *  (The encrypted blob persists on Walrus — true on-chain erasure is roadmap.) */
export function forgetMemory(blobId: string) {
  const set = loadForgotten();
  set.add(blobId);
  persistForgotten(set);
}

export function clearMemories() {
  persist([]);
  persistForgotten(new Set());
}
