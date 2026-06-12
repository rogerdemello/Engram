import "server-only";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/sui/utils";
import { SealClient, SessionKey } from "@mysten/seal";
import type { Signer } from "@mysten/sui/cryptography";
import { suiClient } from "./sui";
import { serverEnv } from "./env";

/**
 * Cryptographic consent gating via Seal + our `mneme_access::seal_approve`.
 *
 * A sensitive memory is Seal-encrypted bound to our package. Decryption keys
 * are released by the Seal key servers ONLY if they can run `seal_approve`
 * successfully — which aborts unless the requester holds a live grant in the
 * shared ConsentRegistry. Revoke on-chain → the key servers refuse → the
 * memory is undecryptable. This is enforced by the network, not by our server.
 *
 * Proven end-to-end in `scripts/dev/seal-proof.mjs`
 * (before grant → denied · after grant → decrypted · after revoke → denied).
 */
function client() {
  return new SealClient({
    // SuiJsonRpcClient satisfies the runtime contract; cast for the typed shape.
    suiClient: suiClient() as never,
    serverConfigs: [
      { objectId: serverEnv().SEAL_KEY_SERVER_1, weight: 1 },
      { objectId: serverEnv().SEAL_KEY_SERVER_2, weight: 1 },
    ],
    verifyKeyServers: false,
  });
}

/** Deterministic Seal identity for a memory. */
export function sealId(namespace: string, memoryKey: string): string {
  return toHex(new TextEncoder().encode(`mem:${namespace}:${memoryKey}`));
}

/** Encrypt text bound to our package + a Seal identity. Returns ciphertext bytes. */
export async function sealEncrypt(text: string, idHex: string): Promise<Uint8Array> {
  const { encryptedObject } = await client().encrypt({
    threshold: 1,
    packageId: serverEnv().MNEME_PACKAGE_ID,
    id: idHex,
    data: new TextEncoder().encode(text),
  });
  return encryptedObject;
}

/** Build the seal_approve PTB the key servers dry-run to authorize decryption. */
async function approveTxBytes(idHex: string, namespace: string): Promise<Uint8Array> {
  const env = serverEnv();
  const tx = new Transaction();
  tx.moveCall({
    target: `${env.MNEME_PACKAGE_ID}::registry::seal_approve`,
    arguments: [tx.pure.vector("u8", fromHex(idHex)), tx.object(env.MNEME_REGISTRY_ID), tx.pure.string(namespace)],
  });
  return tx.build({ client: suiClient() as never, onlyTransactionKind: true });
}

/**
 * Attempt to decrypt as `requester`. Throws (NoAccessError) when the requester
 * lacks a live on-chain grant for `namespace` — i.e. after revoke.
 */
export async function sealDecrypt(opts: {
  ciphertext: Uint8Array;
  idHex: string;
  namespace: string;
  requester: Signer;
  requesterAddress: string;
}): Promise<string> {
  const sk = await SessionKey.create({
    address: opts.requesterAddress,
    packageId: serverEnv().MNEME_PACKAGE_ID,
    ttlMin: 10,
    signer: opts.requester,
    suiClient: suiClient() as never,
  });
  const txBytes = await approveTxBytes(opts.idHex, opts.namespace);
  const out = await client().decrypt({ data: opts.ciphertext, sessionKey: sk, txBytes });
  return new TextDecoder().decode(out);
}
