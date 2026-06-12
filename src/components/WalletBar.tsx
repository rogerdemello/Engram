"use client";
import { ConnectButton } from "@mysten/dapp-kit";
import { useWalletOwner } from "./owner";
import { short } from "@/lib/format";

/**
 * Wallet ownership control. Connect a Sui wallet, then "adopt" it to create
 * your OWN ConsentRegistry — after which grant/revoke are signed by your
 * wallet and the server gates recall on your registry. Until then the demo
 * runs in frictionless server-custody mode.
 */
export function WalletBar() {
  const { address, walletMode, busy, adopt } = useWalletOwner();

  return (
    <div className="flex items-center gap-2">
      {address && !walletMode && (
        <button onClick={adopt} disabled={busy} className="btn" title="Create your own on-chain ConsentRegistry">
          {busy ? "adopting…" : "Adopt wallet as owner"}
        </button>
      )}
      {walletMode && address && (
        <span className="chip" style={{ color: "var(--emerald)", borderColor: "var(--emerald)" }}>
          ● you own consent · {short(address, 5)}
        </span>
      )}
      <ConnectButton />
    </div>
  );
}
