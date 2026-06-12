/**
 * Mneme dev bootstrap (testnet).
 *
 * Idempotent. On first run it:
 *   1. generates an Ed25519 Sui testnet keypair and funds it from the faucet,
 *   2. creates a MemWal account + delegate key on testnet,
 *   3. runs the core round-trip spike (remember -> recall),
 *   4. writes everything to .env.local.
 *
 * Re-running reuses whatever is already in .env.local and just re-runs the spike.
 *
 *   node scripts/dev/bootstrap.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet';
import { MemWal } from '@mysten-incubation/memwal';
import { generateDelegateKey, createAccount, addDelegateKey } from '@mysten-incubation/memwal/account';

const ENV_PATH = new URL('../../.env.local', import.meta.url);

// --- testnet constants (sourced from MystenLabs/MemWal docs + Seal docs) ---
const C = {
  MEMWAL_PACKAGE_ID: '0xcf6ad755a1cdff7217865c796778fabe5aa399cb0cf2eba986f4b582047229c6',
  MEMWAL_REGISTRY_ID: '0xe80f2feec1c139616a86c9f71210152e2a7ca552b20841f2e192f99f75864437',
  MEMWAL_SERVER_URL: 'https://relayer-staging.memory.walrus.xyz',
  SUI_NETWORK: 'testnet',
};

// --- tiny .env.local read/merge/write helpers ---
function readEnv() {
  const out = {};
  if (existsSync(ENV_PATH)) {
    for (const line of readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) out[m[1]] = m[2];
    }
  }
  return out;
}
function writeEnv(env) {
  const body = Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n';
  writeFileSync(ENV_PATH, body);
}

const log = (...a) => console.log('•', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const env = { ...C, ...readEnv() };
  const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });

  // 1. Sui testnet keypair + faucet ----------------------------------------
  let keypair;
  if (env.SUI_PRIVATE_KEY) {
    keypair = Ed25519Keypair.fromSecretKey(env.SUI_PRIVATE_KEY);
    log('reusing Sui key', keypair.getPublicKey().toSuiAddress());
  } else {
    keypair = new Ed25519Keypair();
    env.SUI_PRIVATE_KEY = keypair.getSecretKey();
    env.SUI_ADDRESS = keypair.getPublicKey().toSuiAddress();
    log('generated Sui key', env.SUI_ADDRESS);
    writeEnv(env);
  }
  const address = keypair.getPublicKey().toSuiAddress();
  env.SUI_ADDRESS = address;

  // fund until we have gas
  let bal = BigInt((await client.getBalance({ owner: address })).totalBalance);
  if (bal === 0n) {
    log('requesting faucet…');
    try {
      await requestSuiFromFaucetV2({ host: getFaucetHost('testnet'), recipient: address });
    } catch (e) {
      log('faucet error:', e?.message ?? e);
    }
    for (let i = 0; i < 30 && bal === 0n; i++) {
      await sleep(2000);
      bal = BigInt((await client.getBalance({ owner: address })).totalBalance);
    }
  }
  log('balance:', bal.toString(), 'MIST');
  if (bal === 0n) throw new Error('No testnet SUI after faucet — fund ' + address + ' manually and re-run.');

  // 2. MemWal account + delegate key ---------------------------------------
  if (!env.MEMWAL_ACCOUNT_ID || !env.MEMWAL_PRIVATE_KEY) {
    log('generating delegate key…');
    const delegate = await generateDelegateKey();
    env.MEMWAL_PRIVATE_KEY = delegate.privateKey;
    writeEnv(env);

    log('creating MemWal account on testnet…');
    const account = await createAccount({
      packageId: env.MEMWAL_PACKAGE_ID,
      registryId: env.MEMWAL_REGISTRY_ID,
      suiPrivateKey: env.SUI_PRIVATE_KEY,
      suiNetwork: 'testnet',
      suiClient: client,
    });
    env.MEMWAL_ACCOUNT_ID = account.accountId;
    writeEnv(env);
    log('account:', account.accountId, 'tx', account.digest);

    log('registering delegate key…');
    const added = await addDelegateKey({
      packageId: env.MEMWAL_PACKAGE_ID,
      accountId: account.accountId,
      publicKey: delegate.publicKey,
      label: 'mneme-dev',
      suiPrivateKey: env.SUI_PRIVATE_KEY,
      suiNetwork: 'testnet',
      suiClient: client,
    });
    log('delegate registered, sui addr', added.suiAddress, 'tx', added.digest);
    // a beat for indexers to catch up before first signed request
    await sleep(3000);
  } else {
    log('reusing MemWal account', env.MEMWAL_ACCOUNT_ID);
  }

  // 3. round-trip spike -----------------------------------------------------
  const memwal = MemWal.create({
    key: env.MEMWAL_PRIVATE_KEY,
    accountId: env.MEMWAL_ACCOUNT_ID,
    serverUrl: env.MEMWAL_SERVER_URL,
    namespace: 'spike',
  });

  log('health:', JSON.stringify(await memwal.health()));

  const fact = 'I am vegan and I have a severe peanut allergy.';
  log('remember:', fact);
  const stored = await memwal.rememberAndWait(fact, undefined, { timeoutMs: 60_000 });
  log('stored blob_id:', stored.blob_id, 'owner:', stored.owner);

  log('recall: "what foods must I avoid?"');
  const res = await memwal.recall({ query: 'what foods must I avoid?', topK: 5 });
  for (const m of res.results) log('  ↳', m.distance.toFixed(3), m.text, '(', m.blob_id.slice(0, 12), '…)');

  if (res.results.length === 0) throw new Error('SPIKE FAILED: recall returned nothing.');
  log('\n✅ SPIKE PASSED — memory round-trips end-to-end on testnet.');
  log('   .env.local written with SUI + MemWal credentials.');
}

main().catch((e) => {
  console.error('\n❌ bootstrap failed:', e?.stack ?? e);
  process.exit(1);
});
