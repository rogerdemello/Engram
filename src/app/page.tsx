import Link from "next/link";
import { Wordmark, LogoMark } from "@/components/Logo";

const STEPS = [
  {
    n: "01",
    t: "Capture",
    d: "Tell an AI app about yourself. Each fact is extracted and stored as an encrypted memory on Walrus — you hold the key.",
  },
  {
    n: "02",
    t: "Own & verify",
    d: "Every memory shows its Walrus blob ID. Anyone can fetch it from the public network and confirm it's real — and encrypted.",
  },
  {
    n: "03",
    t: "Share with consent",
    d: "Grant another app access to your memories with an on-chain transaction. It instantly knows what it's allowed to — nothing more.",
  },
  {
    n: "04",
    t: "Audit & revoke",
    d: "Every answer is receipted with the exact memories it used. Revoke an app on-chain and it loses access immediately.",
  },
];

const STACK = ["Walrus", "MemWal", "Seal", "Sui Move", "Next.js"];

export default function Landing() {
  return (
    <div className="max-w-5xl mx-auto px-5">
      <nav className="flex items-center justify-between py-5">
        <Wordmark size={30} />
        <Link href="/app" className="btn btn-primary">
          Launch app →
        </Link>
      </nav>

      {/* hero */}
      <section className="py-16 sm:py-24 flex flex-col items-center text-center gap-6">
        <span className="chip">Built on Sui · Walrus · Seal</span>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
          Your AI&apos;s memory,
          <br />
          <span style={{ background: "linear-gradient(90deg,#8B5CF6,#10B981)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            owned by you and provably honest.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
          Today your AI&apos;s memory of you is locked inside each app — invisible, unportable,
          unauditable. Mneme makes it <b className="text-foreground/90">yours</b>: verifiable on
          Walrus, encrypted with Seal, shared between apps only with your{" "}
          <b className="text-foreground/90">on-chain consent</b>, and every answer{" "}
          <b className="text-foreground/90">receipted</b>.
        </p>
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <Link href="/app" className="btn btn-primary text-base px-6 py-3">
            Try the live demo →
          </Link>
          <span className="chip mono">testnet · no wallet needed</span>
        </div>
      </section>

      {/* steps */}
      <section className="grid sm:grid-cols-2 gap-3 pb-16">
        {STEPS.map((s) => (
          <div key={s.n} className="panel p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="mono text-sm" style={{ color: "var(--violet)" }}>{s.n}</span>
              <span className="font-semibold">{s.t}</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>

      {/* why it matters */}
      <section className="panel p-7 sm:p-10 flex flex-col gap-4 mb-16">
        <div className="flex items-center gap-2.5">
          <LogoMark size={24} />
          <h2 className="text-xl font-semibold">The memory layer for the agentic web</h2>
        </div>
        <p className="text-sm sm:text-base text-muted max-w-3xl leading-relaxed">
          As agents start acting for us — booking, buying, advising — the question isn&apos;t just
          what they can do, but <b className="text-foreground/90">what they remember about us, who
          owns it, and whether we can trust it</b>. Mneme is a portable, user-owned memory account:
          one source of truth your agents read with your permission, that you can audit fact-by-fact
          and revoke at any time.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {STACK.map((s) => (
            <span key={s} className="chip">{s}</span>
          ))}
        </div>
      </section>

      <footer className="text-center text-[0.75rem] text-muted py-8">
        Mneme · Sui Overflow 2026 · Agentic Web × Walrus
      </footer>
    </div>
  );
}
