import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    environmentMatchGlobs: [["tests/integration/**/*.test.tsx", "jsdom"]],
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "client/src"),
      "@shared": resolve(rootDir, "shared"),
    },
  },
});
