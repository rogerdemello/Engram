# Sui Overflow 2026 — Submission sheet (Engram)

Fill these into the DeepSurge submission form.

| Field | Value |
|---|---|
| **Project name** | Engram |
| **Track** | Agentic Web (primary) — also targets the Walrus specialized track |
| **One-liner** | Your AI's memory — owned by you, and provably honest. |
| **Logo (1:1)** | `public/logo.png` (512×512) · `public/logo-1024.png` |
| **Public GitHub repo** | https://github.com/rogerdemello/Engram |
| **Demo video (≤5 min, YouTube)** | _(record per `DEMO.md`)_ |
| **Website** | https://engram-roger-demellos-projects.vercel.app |
| **Deployment** | Sui **testnet** (app live on Vercel) |
| **Package ID** | `0x032dbacbb8573145f3a46dcd4c15ddf4164521504c4507847e5b51d4258361a7` |

## Description (what it does, why it matters)

Engram is a user-owned, verifiable memory layer for AI agents. Today an AI's memory of you is locked
inside each app — invisible, unportable, and unauditable. As agents start acting on our behalf, that
becomes a trust and ownership crisis. Engram makes your AI memory **yours**: every fact an agent learns
is stored encrypted on **Walrus** (via MemWal) with a verifiable blob ID; sharing memory across apps
requires your **on-chain consent** (our `mneme_access` Sui Move contract), enforced live — revoke and
the agent loses access immediately; and every agent answer is **receipted**, citing the exact memories
it used. It's the memory layer for the agentic web: you own your context, and agents stay honest.

## What was built during the hackathon

Everything in this repo: the `mneme_access` Move package (ConsentRegistry + `seal_approve` + audit
events), the full Next.js app (two agents, memory inspector, on-chain consent, Walrus verification),
and the MemWal/Seal/Walrus/Sui integrations. Published to Sui testnet; memories are independently
verifiable on the public Walrus aggregator.

## Pre-submission checklist

- [ ] Repo public
- [ ] Demo video uploaded (YouTube, ≤5 min) — script in `DEMO.md`
- [ ] App deployed + URL live (`DEPLOY.md`)
- [ ] `.env.local` Azure creds set for the recording
- [ ] `node scripts/dev/reset.mjs` run before recording (clean slate)
- [ ] Package ID + testnet links confirmed on suiscan
- [ ] KYC-ready team member identified
