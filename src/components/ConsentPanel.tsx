import { useState } from "react";
import type { Grant } from "@/lib/types";
import { APPS } from "@/lib/constants";
import { txUrl, objUrl } from "@/lib/constants";
import { short } from "@/lib/format";
import { api, notifyChanged } from "@/lib/client";

interface Pair {
  appId: "chat" | "meal";
  namespace: "chat" | "meal";
  label: string;
}

// Cross-app consent: each app may be granted read access to the OTHER's memories.
const PAIRS: Pair[] = [
  { appId: "meal", namespace: "chat", label: `${APPS.meal.name} → read ${APPS.chat.name} memories` },
  { appId: "chat", namespace: "meal", label: `${APPS.chat.name} → read ${APPS.meal.name} memories` },
];

export function ConsentPanel({
  grants,
  registryId,
  packageId,
}: {
  grants: Grant[];
  registryId: string;
  packageId: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [digests, setDigests] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);

  const isActive = (p: Pair) =>
    grants.some((g) => g.app === p.appId && g.namespace === p.namespace && g.active);

  async function toggle(p: Pair) {
    const key = `${p.appId}:${p.namespace}`;
    const active = isActive(p);
    setBusy(key);
    setErr(null);
    try {
      const r = await api.setGrant(p.appId, p.namespace, active); // revoke if currently active
      setDigests((d) => ({ ...d, [key]: r.digest }));
      notifyChanged();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">On-chain consent</div>
        <a href={objUrl(registryId)} target="_blank" rel="noopener noreferrer" className="chip mono hover:text-sky">
          registry ↗
        </a>
      </div>
      <p className="text-[0.72rem] text-muted -mt-1">
        Sharing memory across apps requires your grant — enforced by the{" "}
        <a href={objUrl(packageId)} target="_blank" rel="noopener noreferrer" className="text-sky/90 hover:underline">
          mneme_access
        </a>{" "}
        contract. Revoke and the agent loses access immediately.
      </p>

      {PAIRS.map((p) => {
        const key = `${p.appId}:${p.namespace}`;
        const active = isActive(p);
        return (
          <div key={key} className="flex items-center justify-between gap-3 rounded-xl hairline px-3 py-2.5">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[0.8rem] text-foreground/90">{p.label}</span>
              {digests[key] && (
                <a
                  href={txUrl(digests[key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-[0.68rem] text-sky/80 hover:underline"
                >
                  tx {short(digests[key], 8)} ↗
                </a>
              )}
            </div>
            <button
              onClick={() => toggle(p)}
              disabled={busy === key}
              className="btn shrink-0"
              style={
                active
                  ? { color: "var(--emerald)", borderColor: "var(--emerald)" }
                  : { color: "var(--muted)" }
              }
            >
              {busy === key ? "…" : active ? "● granted — revoke" : "○ grant access"}
            </button>
          </div>
        );
      })}
      {err && <div className="text-[0.72rem]" style={{ color: "var(--rose)" }}>⚠ {err}</div>}
    </div>
  );
}
