import "server-only";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { serverEnv } from "./env";

/** Shared testnet JSON-RPC client (@mysten/sui v2 renamed SuiClient -> SuiJsonRpcClient). */
export function suiClient(): SuiJsonRpcClient {
  return new SuiJsonRpcClient({
    url: getJsonRpcFullnodeUrl("testnet"),
    network: "testnet",
  });
}

/**
 * The server's Sui keypair. In the demo this doubles as the user's wallet
 * (the owner of the ConsentRegistry). In production this would be the
 * connected wallet; here we sign server-side for a frictionless demo.
 */
export function serverKeypair(): Ed25519Keypair {
  return Ed25519Keypair.fromSecretKey(serverEnv().SUI_PRIVATE_KEY);
}

export function serverAddress(): string {
  return serverKeypair().getPublicKey().toSuiAddress();
}
