/**
 * Public, non-secret constants for Engram (Sui testnet).
 * Safe to import from client or server components.
 */

export const NETWORK = "testnet" as const;

/** Walrus testnet aggregator — used to verify a memory blob is live + downloadable. */
export const WALRUS_AGGREGATOR =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ??
  "https://aggregator.walrus-testnet.walrus.space";

/** Explorer base for linking grant/revoke transactions. */
export const SUI_EXPLORER = "https://suiscan.xyz/testnet";
export const txUrl = (digest: string) => `${SUI_EXPLORER}/tx/${digest}`;
export const objUrl = (id: string) => `${SUI_EXPLORER}/object/${id}`;
/** Walrus blob viewer (Walruscan) for a stored memory blob. */
export const blobUrl = (blobId: string) =>
  `https://walruscan.com/testnet/blob/${blobId}`;

/**
 * The two demo apps. Each is a distinct AI agent with its own memory namespace.
 * Cross-app sharing is gated by the on-chain ConsentRegistry: an app may only
 * recall another app's namespace once the user has granted it on-chain.
 */
export interface AppDef {
  id: string;
  /** MemWal namespace this app writes to / owns. */
  namespace: string;
  name: string;
  tagline: string;
  /** Deterministic agent address for this app (set from env at runtime). */
  accent: string;
}

export const APPS: Record<"chat" | "meal", AppDef> = {
  chat: {
    id: "chat",
    namespace: "chat",
    name: "Engram Chat",
    tagline: "Your everyday assistant — it remembers what you tell it.",
    accent: "violet",
  },
  meal: {
    id: "meal",
    namespace: "meal",
    name: "Plate",
    tagline: "A meal planner that never forgets a dietary need.",
    accent: "emerald",
  },
};

export type AppId = keyof typeof APPS;
