import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  globalIgnores([
    ".next/**",
    ".next-*/**",
    "out/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    ".forja/**",
    "docs/**",
    ".data/**",
  ]),
]);

export default eslintConfig;
