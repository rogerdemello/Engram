/** Shared domain types for Mneme. Safe to import anywhere. */

import type { AppId } from "./constants";

/** A single stored memory as surfaced to the UI. */
export interface Memory {
  /** MemWal stable id / vector row id. */
  id: string;
  /** Walrus blob id — the verifiable storage location. */
  blobId: string;
  text: string;
  /** Namespace (which app authored it). */
  namespace: string;
  /** Always true: MemWal Seal-encrypts every memory at rest on Walrus. */
  sealed: boolean;
  /** Mneme's sensitivity classification (health/finance/identity/...). */
  sensitive: boolean;
  /** Sensitivity category when sensitive. */
  sensitivityLabel?: string;
  /** Owner Sui address. */
  owner: string;
  /** ISO timestamp the client stamped on receipt (MemWal has no server time column). */
  createdAt?: string;
}

/** A memory cited by an agent answer (the "receipt"). */
export interface Receipt {
  blobId: string;
  text: string;
  /** Semantic distance from the query (lower = closer). */
  distance: number;
  namespace: string;
}

/** One on-chain consent grant. */
export interface Grant {
  app: AppId;
  appAddress: string;
  namespace: string;
  active: boolean;
}

/** An agent turn returned to the UI. */
export interface AgentTurn {
  reply: string;
  receipts: Receipt[];
  /** Memories newly written from this turn. */
  stored: Memory[];
  /** Set when the agent was blocked from a namespace it lacks consent for. */
  blocked?: { namespace: string; reason: string };
}
