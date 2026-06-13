# Engram — Demo script (≤ 5 min video)

Goal: tell the whole story in one continuous, clickable flow. Record at 1080p+, browser at `/app`.
Run `node scripts/dev/reset.mjs` first for a clean slate (empty inspector, no grants).

> Tip: have Azure OpenAI configured (`.env.local`) so replies are natural. Without it the agents still
> work via a fallback that shows the memory + consent behavior — fine as a backup.

---

### 0:00 — Hook (15s)  · landing page `/`
> "Your AI knows a lot about you. But that memory is trapped inside each app — invisible, unportable,
> and you can't verify what it remembers or why it said something. Engram fixes that. It's a memory
> layer **you** own, on Sui and Walrus." → click **Launch app**.

### 0:15 — Capture (50s)  · Engram Chat
- Type: **"I'm vegan and I have a severe peanut allergy. I'm based in Lisbon."**
> "I tell this assistant about myself…"
- Point to the inspector: three memory cards appear.
> "…and each fact becomes a memory stored **encrypted on Walrus** — see the blob IDs. The allergy is
> auto-flagged **health-sensitive**. I own these."
- Click **verify** on one card → `✓ live on Walrus`.
> "That's not a database row — anyone can fetch this blob from the public Walrus network right now."

### 1:05 — The wall (35s)  · Plate (the meal planner)
- In Plate, type: **"Plan me a quick high-protein dinner."**
> "Here's a *different* app — a meal planner. Watch: it can't help safely…"
- Reply shows **⛔ blocked from: chat (no on-chain consent)**.
> "It's blocked. It has no permission to read what the other app knows. That's the point — apps don't
> get my memory by default."

### 1:40 — Consent (40s)  · Consent panel
> "I grant it access — on-chain."
- Click **grant access** on "Plate → read Engram Chat memories." Show the **tx ↗** link (Sui explorer).
> "That's a real Sui transaction against our `mneme_access` contract. Now…"

### 2:20 — Portability + receipts (45s)  · Plate
- Ask again: **"Plan me a quick high-protein dinner."**
> "…same app, now it knows I'm vegan and allergic to peanuts — and it plans around both."
- Expand the **receipts** under the answer.
> "And it's accountable: every answer shows the **exact memories it used**, each linking to its Walrus
> blob. No hidden reasoning. Ask it *why* and it shows its sources."

### 3:05 — Revoke (35s)  · Consent panel → Plate
- Click **revoke** on the grant (show tx link).
- Ask Plate once more → **⛔ blocked** again.
> "And I can take it back. Revoke on-chain, and it instantly loses access. Not a UI toggle — verifiably
> enforced by the contract."

### 3:40 — Close (30s)  · landing / package on explorer
> "Engram is the memory layer for the agentic web. As agents start acting for us, you should own your
> context, share it on your terms, and audit every answer. Verifiable on Walrus, consent on Sui.
> Built for Sui Overflow 2026."
- Show the package on suiscan + the live URL.

---

**On-screen lower-thirds to flash:** `Walrus blob ✓ verifiable` · `Sui tx: grant_access` · `receipts = which memories were used` · `revoke → access denied`.
