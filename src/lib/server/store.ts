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

let cache: Memory[] | null = null;

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

export function listMemories(namespace?: string): Memory[] {
  const all = load();
  const filtered = namespace ? all.filter((m) => m.namespace === namespace) : all;
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

export function clearMemories() {
  persist([]);
}
