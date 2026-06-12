"use client";
import { useState } from "react";
import type { Memory } from "@/lib/types";
import { blobUrl } from "@/lib/constants";
import { shortBlob } from "@/lib/format";
import { api } from "@/lib/client";

const NS_COLOR: Record<string, string> = {
  chat: "var(--violet)",
  meal: "var(--emerald)",
};

export function MemoryCard({ memory }: { memory: Memory }) {
  const [verify, setVerify] = useState<null | "loading" | "ok" | "fail">(null);
  const [size, setSize] = useState<number | null>(null);
  const color = NS_COLOR[memory.namespace] ?? "var(--muted)";

  async function onVerify() {
    setVerify("loading");
    try {
      const r = await api.verify(memory.blobId);
      setVerify(r.available ? "ok" : "fail");
      setSize(r.size ?? null);
    } catch {
      setVerify("fail");
    }
  }

  return (
    <div className="panel p-3.5 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm leading-relaxed text-foreground/95">{memory.text}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip" style={{ color, borderColor: color }}>
          <span style={{ width: 6, height: 6, borderRadius: 9, background: color, display: "inline-block" }} />
          {memory.namespace}
        </span>
        <span className="chip" title="Encrypted at rest on Walrus via Seal">🔒 sealed</span>
        {memory.sensitive && (
          <span className="chip" style={{ color: "var(--amber)", borderColor: "var(--amber)" }}>
            ⚠ {memory.sensitivityLabel ?? "sensitive"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <a
          href={blobUrl(memory.blobId)}
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-[0.72rem] text-muted hover:text-sky transition-colors"
          title={memory.blobId}
        >
          walrus:{shortBlob(memory.blobId)}
        </a>
        <button
          onClick={onVerify}
          className="text-[0.72rem] font-semibold"
          style={{
            color:
              verify === "ok" ? "var(--emerald)" : verify === "fail" ? "var(--rose)" : "var(--muted)",
          }}
        >
          {verify === null && "verify ↗"}
          {verify === "loading" && "verifying…"}
          {verify === "ok" && `✓ live on Walrus${size ? ` (${size}B)` : ""}`}
          {verify === "fail" && "✗ not found"}
        </button>
      </div>
    </div>
  );
}
