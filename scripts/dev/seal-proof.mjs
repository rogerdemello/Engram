/**
 * Proof: our on-chain mneme_access::seal_approve cryptographically gates Seal
 * decryption. Grant -> decrypt succeeds. Revoke -> decryption is DENIED by the
 * key servers (not by our app). Run against testnet:
 *
 *   node scripts/dev/seal-proof.mjs
 */
import { readFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/sui/utils";
import { SealClient, SessionKey } from "@mysten/seal";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split("\n").filter(Boolean)
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }),
);

const PKG = env.MNEME_PACKAGE_ID;
const REG = env.MNEME_REGISTRY_ID;
const NS = "chat";

const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" });
const owner = Ed25519Keypair.fromSecretKey(env.SUI_PRIVATE_KEY);
const app = new Ed25519Keypair(); // the agent requesting decryption
const appAddr = app.getPublicKey().toSuiAddress();
console.log("• app (decryptor) address:", appAddr);

// Fresh client per attempt: each decrypt is an independent request that must
// re-fetch key shares (so a post-revoke request is genuinely re-checked, not
// served from this process's key cache).
const newSealClient = () =>
  new SealClient({
    suiClient,
    serverConfigs: [
      { objectId: env.SEAL_KEY_SERVER_1 || "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75", weight: 1 },
      { objectId: env.SEAL_KEY_SERVER_2 || "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8", weight: 1 },
    ],
    verifyKeyServers: false,
  });
const sealClient = newSealClient();

const idHex = toHex(new TextEncoder().encode("mem:chat:demo-1"));
const plaintext = "SECRET: user has a severe peanut allergy";

const { encryptedObject } = await sealClient.encrypt({
  threshold: 1,
  packageId: PKG,
  id: idHex,
  data: new TextEncoder().encode(plaintext),
});
console.log("• encrypted memory:", encryptedObject.length, "bytes (bound to", PKG.slice(0, 10) + "…/seal_approve)");

async function approveTxBytes() {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PKG}::registry::seal_approve`,
    arguments: [tx.pure.vector("u8", fromHex(idHex)), tx.object(REG), tx.pure.string(NS)],
  });
  return tx.build({ client: suiClient, onlyTransactionKind: true });
}

async function tryDecrypt(label) {
  const client = newSealClient(); // independent request → no cached keys
  const sk = await SessionKey.create({ address: appAddr, packageId: PKG, ttlMin: 10, signer: app, suiClient });
  const txBytes = await approveTxBytes();
  try {
    const out = await client.decrypt({ data: encryptedObject, sessionKey: sk, txBytes });
    console.log(`  ${label} -> ✅ DECRYPTED: "${new TextDecoder().decode(out)}"`);
    return true;
  } catch (e) {
    console.log(`  ${label} -> ⛔ DENIED (${e?.constructor?.name}): ${(e?.message || "").slice(0, 70)}`);
    return false;
  }
}

async function setGrant(fn) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PKG}::registry::${fn}`,
    arguments: [tx.object(REG), tx.pure.address(appAddr), tx.pure.string(NS)],
  });
  const r = await suiClient.signAndExecuteTransaction({ signer: owner, transaction: tx, options: { showEffects: true } });
  await suiClient.waitForTransaction({ digest: r.digest });
  console.log("•", fn, "tx", r.digest);
}

console.log("\n1) before any grant:");
await tryDecrypt("decrypt");
console.log("\n2) grant access on-chain, then decrypt:");
await setGrant("grant_access");
await new Promise((r) => setTimeout(r, 2500));
await tryDecrypt("decrypt");
console.log("\n3) revoke on-chain, then decrypt:");
await setGrant("revoke_access");
await new Promise((r) => setTimeout(r, 2500));
await tryDecrypt("decrypt");
console.log("\n(If 1+3 deny and 2 decrypts, the contract cryptographically gates Seal.)");
