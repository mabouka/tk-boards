import { defineConfig, devices } from '@playwright/test'
import { BASE_URL, DB_URL, OUTBOX, PORT } from './test/e2e/constants'

// E2E drives the real app (Next dev server) against a throwaway Postgres started
// in global-setup. The app runs with DB_DRIVER=pg and the dev email fallback
// (no RESEND_API_KEY), writing action links to the outbox the specs read.
export default defineConfig({
  testDir: './test/e2e',
  globalSetup: './test/e2e/global-setup.ts',
  globalTeardown: './test/e2e/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Production build + start (a 2nd `next dev` is blocked while a dev server runs).
    // NEXT_DIST_DIR keeps this build isolated from a running dev server's .next.
    command: `next build && next start -p ${PORT}`,
    url: `${BASE_URL}/en/login`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      HOLDING_PAGE: 'off', // disable the under-construction gate for the test
      DB_DRIVER: 'pg',
      DB_DATABASE_URL: DB_URL,
      RESEND_API_KEY: '', // force the dev email fallback → outbox
      EMAIL_OUTBOX_FILE: OUTBOX,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      AUTH_SECRET: 'e2e-only-secret-not-used-in-prod',
      AUTH_URL: BASE_URL,
      AUTH_TRUST_HOST: 'true',
      AUTH_GOOGLE_ID: 'e2e',
      AUTH_GOOGLE_SECRET: 'e2e',
      AUTH_FACEBOOK_ID: 'e2e',
      AUTH_FACEBOOK_SECRET: 'e2e',
    },
  },
})
