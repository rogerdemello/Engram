"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

const PKG = process.env.NEXT_PUBLIC_MNEME_PACKAGE_ID ?? "";
const APP_ADDR: Record<string, string> = {
  chat: process.env.NEXT_PUBLIC_CHAT_APP_ADDRESS ?? "",
  meal: process.env.NEXT_PUBLIC_MEAL_APP_ADDRESS ?? "",
};

interface OwnerCtx {
  /** Connected wallet address, or null. */
  address: string | null;
  /** The user's own ConsentRegistry id once adopted (wallet mode), else null. */
  registryId: string | null;
  /** true once the connected wallet owns a registry → grants are wallet-signed. */
  walletMode: boolean;
  busy: boolean;
  /** Create the user's own registry (wallet-signed) and switch to wallet mode. */
  adopt: () => Promise<void>;
  /** Grant/revoke signed by the wallet against the user's registry. Returns digest. */
  walletGrant: (appId: string, namespace: string, revoke: boolean) => Promise<string>;
}

const Ctx = createContext<OwnerCtx | null>(null);
export const useWalletOwner = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWalletOwner must be used within WalletOwnerProvider");
  return c;
};

export function WalletOwnerProvider({ children }: { children: React.ReactNode }) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [registryId, setRegistryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const address = account?.address ?? null;

  // restore the user's registry for this address from localStorage
  useEffect(() => {
    if (!address) {
      setRegistryId(null);
      return;
    }
    const saved = localStorage.getItem(`mneme:registry:${address}`);
    setRegistryId(saved);
  }, [address]);

  const adopt = useCallback(async () => {
    if (!address) return;
    setBusy(true);
    try {
      const tx = new Transaction();
      tx.moveCall({ target: `${PKG}::registry::create` });
      const res = await signAndExecute({ transaction: tx });
      const full = await client.getTransactionBlock({
        digest: res.digest,
        options: { showObjectChanges: true },
      });
      const created = (full.objectChanges ?? []).find(
        (c) => c.type === "created" && (c as { objectType?: string }).objectType?.includes("ConsentRegistry"),
      ) as { objectId?: string } | undefined;
      if (created?.objectId) {
        localStorage.setItem(`mneme:registry:${address}`, created.objectId);
        setRegistryId(created.objectId);
      }
    } finally {
      setBusy(false);
    }
  }, [address, client, signAndExecute]);

  const walletGrant = useCallback(
    async (appId: string, namespace: string, revoke: boolean) => {
      if (!registryId) throw new Error("adopt a wallet registry first");
      const tx = new Transaction();
      tx.moveCall({
        target: `${PKG}::registry::${revoke ? "revoke_access" : "grant_access"}`,
        arguments: [tx.object(registryId), tx.pure.address(APP_ADDR[appId]), tx.pure.string(namespace)],
      });
      const res = await signAndExecute({ transaction: tx });
      return res.digest;
    },
    [registryId, signAndExecute],
  );

  return (
    <Ctx.Provider
      value={{ address, registryId, walletMode: Boolean(registryId), busy, adopt, walletGrant }}
    >
      {children}
    </Ctx.Provider>
  );
}
