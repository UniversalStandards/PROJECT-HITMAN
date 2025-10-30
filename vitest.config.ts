import { defineConfig } from "vitest/config";
import path from "node:path";

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
    },
  },
});
