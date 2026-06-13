# Deploying Engram

Engram has a server runtime (route handlers hold the MemWal delegate key, the Sui signer, and the
Azure key), so the **app** is hosted on a Node host (Vercel). Walrus Sites is static-only, so we use
it to **dogfood Walrus for the landing page**.

## 1. App → Vercel (primary)

```bash
npm i -g vercel
vercel link            # once
vercel --prod
```

Set the env vars from `.env.local` in the Vercel project (Settings → Environment Variables). At minimum:
`SUI_PRIVATE_KEY, SUI_ADDRESS, MEMWAL_*, MNEME_PACKAGE_ID, MNEME_REGISTRY_ID, CHAT_APP_ADDRESS,
MEAL_APP_ADDRESS, AZURE_OPENAI_*`, and the `NEXT_PUBLIC_*` mirrors.

> Note: the local memory **index** (`data/memories.json`) is ephemeral on serverless — memories
> themselves live on Walrus (the source of truth). For a stable live/demo-day instance, run
> `pnpm build && pnpm start` on a small always-on VM, or seed before the demo. Inspector data
> repopulates as you capture.

## 2. Landing → Walrus Sites (dogfood)

```bash
suiup install walrus-sites          # provides the site-builder CLI
# export a static landing (or point at any static export of the marketing page), then:
site-builder --context=testnet deploy --epochs 30 ./out
```

This publishes the landing to decentralized storage, reachable via a Walrus portal
(`https://<name>-wal.wal.app`) — a genuine "our own front door is on Walrus" talking point.

## 3. Mainnet (post-hackathon — unlocks 100% of prize upfront)

Architected as a config flip:
- Repoint MemWal to the mainnet relayer + package/registry (see `.env.local.example`).
- `sui client switch --env mainnet` and `sui client publish` the `mneme_access` package on mainnet;
  set the mainnet `MNEME_PACKAGE_ID` / `MNEME_REGISTRY_ID`.
- Switch Seal to mainnet key servers.

The app code is network-agnostic; only env values change.
