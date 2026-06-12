import "server-only";
import { MemWal } from "@mysten-incubation/memwal";
import { serverEnv } from "./env";

/**
 * Build a MemWal client scoped to a single namespace (one per demo app).
 *
 * All apps share the user's single MemWal account (the user owns their
 * memory); the namespace isolates each app's writes. Cross-app reads are
 * gated by the on-chain ConsentRegistry — see `consent.ts`.
 */
export function getMemwal(namespace: string): MemWal {
  const e = serverEnv();
  return MemWal.create({
    key: e.MEMWAL_PRIVATE_KEY,
    accountId: e.MEMWAL_ACCOUNT_ID,
    serverUrl: e.MEMWAL_SERVER_URL,
    namespace,
  });
}
