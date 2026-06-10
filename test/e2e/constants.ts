import { resolve } from 'node:path'

// Shared between playwright.config.ts, the global setup/teardown and the specs.
export const PORT = 3100
export const BASE_URL = `http://127.0.0.1:${PORT}`
export const DB_URL = 'postgresql://test:test@127.0.0.1:5544/test'
export const PG_CONTAINER = 'tk-e2e-pg'
export const OUTBOX = resolve(process.cwd(), '.e2e-outbox.log')
