/**
 * Reset to a clean demo slate:
 *   - clears the local memory index (data/memories.json)
 *   - revokes both cross-app grants on-chain so consent starts at "off"
 *
 * Memories already on Walrus are NOT deleted (they're immutable + owned);
 * this just clears the local index so the inspector starts empty for a live
 * "teach it from scratch" demo.
 *
 *   node scripts/dev/reset.mjs
 */
import { readFileSync, existsSync, rmSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

// clear local index
const idx = new URL("../../data/memories.json", import.meta.url);
if (existsSync(idx)) {
  rmSync(idx);
  console.log("• cleared local memory index");
}

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" });
const keypair = Ed25519Keypair.fromSecretKey(env.SUI_PRIVATE_KEY);

const pairs = [
  { app: env.MEAL_APP_ADDRESS, ns: "chat" },
  { app: env.CHAT_APP_ADDRESS, ns: "meal" },
];

const tx = new Transaction();
for (const p of pairs) {
  tx.moveCall({
    target: `${env.MNEME_PACKAGE_ID}::registry::revoke_access`,
    arguments: [tx.object(env.MNEME_REGISTRY_ID), tx.pure.address(p.app), tx.pure.string(p.ns)],
  });
}
const res = await client.signAndExecuteTransaction({ signer: keypair, transaction: tx, options: { showEffects: true } });
await client.waitForTransaction({ digest: res.digest });
console.log("• revoked both cross-app grants — tx", res.digest);
console.log("\n✅ clean slate. Restart the app (or refresh) for an empty inspector + no consent.");
