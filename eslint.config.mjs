import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**", // isolated E2E build output
    "out/**",
    "build/**",
    ".vercel/**", // local `vercel build` / `vercel pull` output (build artifacts + pulled env)
    "next-env.d.ts",
    // Playwright artifacts
    "test-results/**",
    "playwright-report/**",
    // Vendored shadcn/ui primitives (managed by the shadcn CLI — not hand-edited).
    "components/admin/ui/**",
    "components/admin/hooks/**",
  ]),
]);

export default eslintConfig;
