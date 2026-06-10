import type { PgDatabase } from 'drizzle-orm/pg-core'

// Any drizzle Postgres database — neon-http in the app, node-postgres in tests.
// Lets DB-logic modules take the client as a param so they're integration-testable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- driver-agnostic boundary
export type AnyPgDatabase = PgDatabase<any, any>
