import "server-only";

/**
 * Server-only environment access. Throws clearly if a required secret is
 * missing so failures are obvious in dev rather than producing cryptic
 * downstream errors. Azure/agent vars are optional — the app runs without
 * them; only the agent chat endpoints require them.
 */
function need(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(
      `Missing required env ${key}. Run \`node scripts/dev/bootstrap.mjs\` or copy .env.local.example to .env.local.`,
    );
  }
  return v;
}

function opt(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export function serverEnv() {
  return {
    // --- Sui / owner ---
    SUI_PRIVATE_KEY: need("SUI_PRIVATE_KEY"),
    SUI_ADDRESS: opt("SUI_ADDRESS"),
    SUI_NETWORK: opt("SUI_NETWORK", "testnet"),

    // --- MemWal ---
    MEMWAL_PRIVATE_KEY: need("MEMWAL_PRIVATE_KEY"),
    MEMWAL_ACCOUNT_ID: need("MEMWAL_ACCOUNT_ID"),
    MEMWAL_SERVER_URL: opt(
      "MEMWAL_SERVER_URL",
      "https://relayer-staging.memory.walrus.xyz",
    ),
    MEMWAL_PACKAGE_ID: opt("MEMWAL_PACKAGE_ID"),
    MEMWAL_REGISTRY_ID: opt("MEMWAL_REGISTRY_ID"),

    // --- Seal ---
    SEAL_KEY_SERVER_1: opt(
      "SEAL_KEY_SERVER_1",
      "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    ),
    SEAL_KEY_SERVER_2: opt(
      "SEAL_KEY_SERVER_2",
      "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
    ),

    // --- mneme_access (our Move package) ---
    MNEME_PACKAGE_ID: need("MNEME_PACKAGE_ID"),
    MNEME_REGISTRY_ID: need("MNEME_REGISTRY_ID"),

    // --- per-app agent identities (granted access on-chain) ---
    CHAT_APP_ADDRESS: opt("CHAT_APP_ADDRESS"),
    MEAL_APP_ADDRESS: opt("MEAL_APP_ADDRESS"),

    // --- Azure OpenAI (agents) — optional until you add them ---
    AZURE_OPENAI_API_KEY: opt("AZURE_OPENAI_API_KEY"),
    AZURE_OPENAI_RESOURCE_NAME: opt("AZURE_OPENAI_RESOURCE_NAME"),
    AZURE_OPENAI_BASE_URL: opt("AZURE_OPENAI_BASE_URL"),
    AZURE_OPENAI_DEPLOYMENT: opt("AZURE_OPENAI_DEPLOYMENT", "gpt-4o"),
    AZURE_OPENAI_API_VERSION: opt("AZURE_OPENAI_API_VERSION", "2024-10-21"),
  };
}

export type ServerEnv = ReturnType<typeof serverEnv>;

/** App id -> the on-chain agent address we grant/revoke. */
export function appAddress(appId: string): string {
  const e = serverEnv();
  return appId === "meal" ? e.MEAL_APP_ADDRESS : e.CHAT_APP_ADDRESS;
}
