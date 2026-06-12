"use client";
import { useCallback, useEffect, useState } from "react";
import { APPS, objUrl } from "@/lib/constants";
import { short } from "@/lib/format";
import type { Memory, Grant } from "@/lib/types";
import { api, onChanged } from "@/lib/client";
import { Wordmark } from "./Logo";
import { AgentPanel } from "./AgentPanel";
import { ConsentPanel } from "./ConsentPanel";
import { MemoryCard } from "./MemoryCard";
import { WalletBar } from "./WalletBar";
import { useWalletOwner } from "./owner";

const PKG = process.env.NEXT_PUBLIC_MNEME_PACKAGE_ID ?? "";
const REG = process.env.NEXT_PUBLIC_MNEME_REGISTRY_ID ?? "";

type Filter = "all" | "chat" | "meal";

export function Dashboard() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const { registryId } = useWalletOwner();
  const activeReg = registryId ?? REG;

  const refresh = useCallback(async () => {
    try {
      const [m, g] = await Promise.all([api.memories(), api.grants(registryId ?? undefined)]);
      setMemories(m.memories);
      setGrants(g.grants);
    } catch {
      /* ignore transient */
    }
  }, [registryId]);

  useEffect(() => {
    refresh();
    return onChanged(refresh);
  }, [refresh]);

  const shown = filter === "all" ? memories : memories.filter((m) => m.namespace === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col gap-5">
      {/* header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <Wordmark size={30} />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="chip"><span className="live-dot" /> Sui testnet</span>
          {PKG && (
            <a href={objUrl(PKG)} target="_blank" rel="noopener noreferrer" className="chip mono hover:text-sky">
              pkg {short(PKG, 6)} ↗
            </a>
          )}
          <WalletBar />
        </div>
      </header>

      <p className="text-sm text-muted -mt-1 max-w-2xl">
        Two different AI apps, one memory you own. Teach <b className="text-foreground/90">Mneme Chat</b>,
        then grant <b className="text-foreground/90">Plate</b> access on-chain and watch it use the same
        verified memories — every answer receipted. Revoke anytime.
      </p>

      {/* agents */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AgentPanel
          app={APPS.chat}
          capture
          registryId={registryId ?? undefined}
          starters={[
            "I'm vegan and I have a severe peanut allergy.",
            "I prefer morning meetings and I'm based in Lisbon.",
          ]}
        />
        <AgentPanel
          app={APPS.meal}
          capture={false}
          registryId={registryId ?? undefined}
          starters={[
            "Plan me a quick high-protein dinner.",
            "Why did you choose that — what do you know about me?",
          ]}
        />
      </div>

      {/* inspector + consent */}
      <div className="grid lg:grid-cols-12 gap-4">
        <section className="lg:col-span-7 panel p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">
              Memory inspector <span className="text-muted font-normal">· {shown.length}</span>
            </div>
            <div className="flex gap-1">
              {(["all", "chat", "meal"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="chip"
                  style={filter === f ? { color: "var(--foreground)", borderColor: "#34344f" } : {}}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="text-xs text-muted py-8 text-center">
              No memories yet. Tell Mneme Chat something about yourself ↑
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {shown.map((m) => (
                <MemoryCard key={m.blobId} memory={m} />
              ))}
            </div>
          )}
        </section>

        <div className="lg:col-span-5">
          <ConsentPanel grants={grants} registryId={activeReg} packageId={PKG} />
        </div>
      </div>

      <footer className="text-center text-[0.72rem] text-muted py-3">
        Memories on Walrus · encrypted with Seal · consent on Sui ·{" "}
        <a href={objUrl(REG)} target="_blank" rel="noopener noreferrer" className="hover:text-sky">
          ConsentRegistry
        </a>
      </footer>
    </div>
  );
}
