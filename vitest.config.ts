import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

// Unit tests target framework-free domain logic (lib/**). No DOM, no DB.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    // Several lib/ modules hold pure logic but sit in a file that builds a client at
    // import time — the Sanity client (invoice.ts, product-images.ts) and the Neon
    // handle (invoice.ts) — each of which throws when its config is absent, which is
    // what made that logic untestable. These dummies only let the import succeed.
    //
    // The database host is deliberately under `.test`, a TLD reserved by RFC 2606 that
    // can never resolve: dev and prod share one Neon database, so a unit test must fail
    // loudly rather than ever reach it. Nothing here touches the network; Sanity image
    // URLs are built offline and come out deterministic.
    env: {
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'testproject',
      NEXT_PUBLIC_SANITY_DATASET: 'testdata',
      DB_DATABASE_URL: 'postgresql://unit:test@unit-tests-never-query.test/none',
    },
  },
})
