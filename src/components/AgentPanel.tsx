import { useRef, useState } from "react";
import type { AppDef } from "@/lib/constants";
import { blobUrl } from "@/lib/constants";
import { shortBlob } from "@/lib/format";
import type { Receipt } from "@/lib/types";
import { api, notifyChanged } from "@/lib/client";

const ACCENT: Record<string, string> = { violet: "var(--violet)", emerald: "var(--emerald)" };

interface Msg {
  role: "user" | "agent";
  text: string;
  receipts?: Receipt[];
  blocked?: { namespace: string; reason: string }[];
  storedCount?: number;
}

export function AgentPanel({
  app,
  capture,
  starters,
  registryId,
}: {
  app: AppDef;
  capture: boolean;
  starters?: string[];
  registryId?: string;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const accent = ACCENT[app.accent] ?? "var(--violet)";
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const r = await api.agent(app.id, text, capture, registryId);
      setMsgs((m) => [
        ...m,
        {
          role: "agent",
          text: r.reply,
          receipts: r.receipts,
          blocked: r.blocked,
          storedCount: r.stored?.length ?? 0,
        },
      ]);
      notifyChanged();
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "agent", text: `⚠ ${e instanceof Error ? e.message : "error"}` },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
      );
    }
  }

  return (
    <div className="panel flex flex-col h-[520px] overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <span style={{ width: 9, height: 9, borderRadius: 9, background: accent }} />
        <div className="flex-1">
          <div className="font-semibold text-sm leading-tight">{app.name}</div>
          <div className="text-[0.72rem] text-muted">{app.tagline}</div>
        </div>
        <span className="chip mono">ns:{app.namespace}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {msgs.length === 0 && (
          <div className="flex flex-col gap-2 m-auto text-center">
            <div className="text-xs text-muted max-w-[15rem]">
              {capture
                ? "Tell it about yourself — it stores each fact as a verifiable memory you own."
                : "Ask it to plan something. It can only use memories you've granted it on-chain."}
            </div>
            {starters && (
              <div className="flex flex-col gap-1.5 mt-1">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[0.78rem] text-left px-2.5 py-1.5 rounded-lg hairline hover:bg-panel-2 text-foreground/80"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[92%]"}>
            <div
              className="rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
              style={
                m.role === "user"
                  ? { background: "#1b1b2b", border: "1px solid var(--border)" }
                  : { background: "rgba(139,92,246,0.06)", border: `1px solid ${accent}33` }
              }
            >
              {m.text}
            </div>

            {!!m.storedCount && (
              <div className="text-[0.7rem] mt-1 ml-1" style={{ color: accent }}>
                + stored {m.storedCount} new {m.storedCount === 1 ? "memory" : "memories"} on Walrus
              </div>
            )}

            {m.blocked && m.blocked.length > 0 && (
              <div className="text-[0.7rem] mt-1 ml-1" style={{ color: "var(--rose)" }}>
                ⛔ blocked from: {m.blocked.map((b) => b.namespace).join(", ")} (no on-chain consent)
              </div>
            )}

            {m.receipts && m.receipts.length > 0 && (
              <div className="mt-2 ml-1 flex flex-col gap-1">
                <div className="text-[0.66rem] uppercase tracking-wide text-muted">
                  receipts · memories this answer used
                </div>
                {m.receipts.map((r) => (
                  <a
                    key={r.blobId}
                    href={blobUrl(r.blobId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 text-[0.72rem] px-2 py-1 rounded-lg hairline hover:bg-panel-2"
                  >
                    <span className="truncate text-foreground/80">{r.text}</span>
                    <span className="mono text-muted shrink-0">{r.namespace}·{shortBlob(r.blobId, 6)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && <div className="self-start text-xs text-muted ml-1">thinking…</div>}
      </div>

      <div className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder={capture ? "Tell me something about you…" : "Ask me to plan a meal…"}
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={() => send(input)} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
}
