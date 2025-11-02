import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["client/**/__tests__/**/*.[jt]sx", "jsdom"],
      ["client/**/*.test.[jt]sx", "jsdom"],
      ["tests/integration/**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    coverage: {
      reporter: ["text", "lcov"],
      include: ["client/src/**/*.{ts,tsx}", "server/**/*.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(rootDir, "client/src"),
      "@shared": resolve(rootDir, "shared"),
    },
  },
});
