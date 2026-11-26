import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const COVERAGE_MINIMUM = 80;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Anti-OOM (cgroup de 4 GiB): um único processo filho, arquivos em série.
    pool: "forks",
    maxWorkers: 1,
    fileParallelism: false,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
      reporter: ["text", "json-summary"],
      thresholds: {
        lines: COVERAGE_MINIMUM,
        functions: COVERAGE_MINIMUM,
        branches: COVERAGE_MINIMUM,
        statements: COVERAGE_MINIMUM,
      },
    },
  },
});
