/**
 * Polls the dev SUI address until it has a balance, then exits 0.
 * Used to gate the bootstrap on the user funding the faucet address.
 *   node scripts/dev/wait-funded.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';

const ENV_PATH = new URL('../../.env.local', import.meta.url);
let address = '0x0984fb5dc447068bb3184b67f835cb32cd6c13f6ce2bbafa492b9b206b822bb2';
if (existsSync(ENV_PATH)) {
  const m = readFileSync(ENV_PATH, 'utf8').match(/^SUI_ADDRESS=(.*)$/m);
  if (m && m[1]) address = m[1].trim();
}

const client = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('testnet') });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log('waiting for funds at', address);
for (let i = 0; i < 360; i++) {
  const bal = BigInt((await client.getBalance({ owner: address })).totalBalance);
  if (bal > 0n) {
    console.log('FUNDED', bal.toString(), 'MIST');
    process.exit(0);
  }
  await sleep(5000);
}
console.error('timed out waiting for funds');
process.exit(1);
