import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const stub = fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "server-only": stub,
      "client-only": stub,
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
