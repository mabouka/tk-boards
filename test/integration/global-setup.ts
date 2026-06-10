import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { Client } from 'pg'

// Spins up a throwaway Postgres for the whole integration run, applies the
// generated schema DDL once, and hands the connection string to the test files
// via vitest's provide/inject. Container is torn down at the end.
let container: StartedPostgreSqlContainer

type Provide = <K extends keyof import('vitest').ProvidedContext>(
  key: K,
  value: import('vitest').ProvidedContext[K]
) => void

export default async function setup({ provide }: { provide: Provide }) {
  container = await new PostgreSqlContainer('postgres:16-alpine').start()
  const connectionString = container.getConnectionUri()

  const ddl = readFileSync(resolve(process.cwd(), 'drizzle/0000_init.sql'), 'utf8')
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)

  const client = new Client({ connectionString })
  await client.connect()
  for (const stmt of ddl) await client.query(stmt)
  await client.end()

  provide('connectionString', connectionString)

  return async () => {
    await container.stop()
  }
}
