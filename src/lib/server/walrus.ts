import "server-only";
import { WALRUS_AGGREGATOR } from "../constants";

/**
 * Verify a memory blob is genuinely live and downloadable from Walrus.
 * We hit the public testnet aggregator with a HEAD/GET; a 200 proves the
 * blob is certified + available (Walrus only serves certified blobs).
 *
 * This powers the "verified" badge and the Verify panel — the user can
 * confirm their memory really exists on decentralized storage, not just in
 * our database.
 */
export interface BlobVerification {
  blobId: string;
  available: boolean;
  /** Byte length when available. */
  size?: number;
  status: number;
  url: string;
}

export async function verifyBlob(blobId: string): Promise<BlobVerification> {
  const url = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    let size: number | undefined;
    if (res.ok) {
      const buf = await res.arrayBuffer();
      size = buf.byteLength;
    }
    return { blobId, available: res.ok, size, status: res.status, url };
  } catch {
    return { blobId, available: false, status: 0, url };
  }
}
