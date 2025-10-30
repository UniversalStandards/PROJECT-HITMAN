import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    environmentMatchGlobs: [
      ["client/**/__tests__/**/*.[jt]sx", "jsdom"],
      ["client/**/*.test.[jt]sx", "jsdom"],
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
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
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
