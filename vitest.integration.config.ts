import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Integration tests run against a real (throwaway) Postgres via testcontainers.
// Kept out of the default `vitest` run so unit tests stay fast and offline.
// fileParallelism:false → files run one at a time, so no cross-file truncate races
// on the shared database.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['test/integration/**/*.test.ts'],
    globalSetup: ['test/integration/global-setup.ts'],
    // Modules under test import the @/db singleton (neon-http) at load time; give it
    // a parseable URL so construction doesn't throw. It's never queried — tests use
    // the injected node-postgres client.
    env: { DB_DATABASE_URL: 'postgresql://u:p@db.invalid/neondb' },
    fileParallelism: false,
    hookTimeout: 120_000, // first run pulls the postgres image
    testTimeout: 30_000,
  },
})
