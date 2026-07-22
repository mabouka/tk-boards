import { execFileSync } from 'node:child_process'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { Client } from 'pg'

// Spins up a throwaway Postgres for the whole integration run, builds the schema
// in it, and hands the connection string to the test files via vitest's
// provide/inject. Container is torn down at the end.
let container: StartedPostgreSqlContainer

type Provide = <K extends keyof import('vitest').ProvidedContext>(
  key: K,
  value: import('vitest').ProvidedContext[K]
) => void

/**
 * DDL for the *current* schema, derived from db/schema.ts.
 *
 * This used to replay drizzle/0000_init.sql, which had silently gone stale: the
 * project moved to `db:push`, so that snapshot never gained mini_configurator nor
 * any of the order tables, and a test touching them would have failed on a missing
 * relation. Deriving it here means the container can never drift from the schema.
 *
 * `--dialect` and `--schema` are passed explicitly so drizzle-kit never loads
 * drizzle.config.ts — that config points at the production database, and export
 * must stay a purely offline schema-to-SQL transform.
 */
function schemaDdl(): string {
  return execFileSync(
    'npx',
    ['drizzle-kit', 'export', '--dialect', 'postgresql', '--schema', './db/schema.ts'],
    { encoding: 'utf8', cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] }
  )
}

export default async function setup({ provide }: { provide: Provide }) {
  const ddl = schemaDdl()
  container = await new PostgreSqlContainer('postgres:16-alpine').start()
  const connectionString = container.getConnectionUri()

  const client = new Client({ connectionString })
  await client.connect()
  await client.query(ddl) // plain SQL, statements separated by ';'
  await client.end()

  provide('connectionString', connectionString)

  return async () => {
    await container.stop()
  }
}
