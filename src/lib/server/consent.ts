import "server-only";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient, serverKeypair } from "./sui";
import { serverEnv } from "./env";
import type { Grant } from "../types";

/**
 * On-chain consent layer backed by the `mneme_access::registry` package.
 *
 * The ConsentRegistry is the single source of truth for which app (agent
 * address) may read which namespace. Grants/revokes are real Sui
 * transactions that emit audit events; the agent endpoints read this state
 * before allowing any cross-app memory recall.
 */

interface RawGrantEntry {
  fields: {
    key: { fields: { app: string; namespace: string } };
    value: boolean;
  };
}

/** Read all grant rows from the ConsentRegistry object content. */
export async function readGrants(): Promise<
  { app: string; namespace: string; active: boolean }[]
> {
  const env = serverEnv();
  const res = await suiClient().getObject({
    id: env.MNEME_REGISTRY_ID,
    options: { showContent: true },
  });
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return [];
  // VecMap serializes as { grants: { fields: { contents: [...] } } }
  const fields = content.fields as Record<string, unknown>;
  const grants = fields.grants as { fields?: { contents?: RawGrantEntry[] } } | undefined;
  const contents = grants?.fields?.contents ?? [];
  return contents.map((e) => ({
    app: e.fields.key.fields.app,
    namespace: e.fields.key.fields.namespace,
    active: e.fields.value,
  }));
}

/** Is `app` allowed to read `namespace`? Owner address is always allowed. */
export async function isAuthorized(app: string, namespace: string): Promise<boolean> {
  const env = serverEnv();
  if (app.toLowerCase() === env.SUI_ADDRESS.toLowerCase()) return true;
  const grants = await readGrants();
  return grants.some(
    (g) => g.app.toLowerCase() === app.toLowerCase() && g.namespace === namespace && g.active,
  );
}

async function callRegistry(fn: "grant_access" | "revoke_access", app: string, namespace: string) {
  const env = serverEnv();
  const tx = new Transaction();
  tx.moveCall({
    target: `${env.MNEME_PACKAGE_ID}::registry::${fn}`,
    arguments: [tx.object(env.MNEME_REGISTRY_ID), tx.pure.address(app), tx.pure.string(namespace)],
  });
  const client = suiClient();
  const res = await client.signAndExecuteTransaction({
    signer: serverKeypair(),
    transaction: tx,
    options: { showEffects: true },
  });
  await client.waitForTransaction({ digest: res.digest });
  return res.digest;
}

export function grantAccess(app: string, namespace: string) {
  return callRegistry("grant_access", app, namespace);
}

export function revokeAccess(app: string, namespace: string) {
  return callRegistry("revoke_access", app, namespace);
}

/** Map raw grants to typed UI grants for the two known apps. */
export function toUiGrants(
  raw: { app: string; namespace: string; active: boolean }[],
): Grant[] {
  const env = serverEnv();
  const byAddr: Record<string, "chat" | "meal"> = {
    [env.CHAT_APP_ADDRESS.toLowerCase()]: "chat",
    [env.MEAL_APP_ADDRESS.toLowerCase()]: "meal",
  };
  return raw
    .map((g) => {
      const app = byAddr[g.app.toLowerCase()];
      if (!app) return null;
      return { app, appAddress: g.app, namespace: g.namespace, active: g.active };
    })
    .filter((g): g is Grant => g !== null);
}
