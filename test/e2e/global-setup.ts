import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { Client } from 'pg'
import { DB_URL, PG_CONTAINER, OUTBOX } from './constants'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Starts a throwaway Postgres at a fixed port (so the webServer's DB URL is
// static), applies the schema, and clears the email outbox. The Next dev server
// (DB_DRIVER=pg) connects to it lazily on the first request.
export default async function globalSetup() {
  try {
    execSync(`docker rm -f ${PG_CONTAINER}`, { stdio: 'ignore' })
  } catch {
    /* not running */
  }
  execSync(
    `docker run -d --name ${PG_CONTAINER} -p 5544:5432 ` +
      `-e POSTGRES_USER=test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test postgres:16-alpine`,
    { stdio: 'ignore' }
  )

  let ready = false
  for (let i = 0; i < 60 && !ready; i++) {
    const c = new Client({ connectionString: DB_URL })
    try {
      await c.connect()
      await c.query('select 1')
      ready = true
    } catch {
      await sleep(500)
    } finally {
      await c.end().catch(() => {})
    }
  }
  if (!ready) throw new Error('E2E Postgres did not become ready')

  const ddl = readFileSync('drizzle/0000_init.sql', 'utf8')
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)
  const c = new Client({ connectionString: DB_URL })
  await c.connect()
  for (const stmt of ddl) await c.query(stmt)
  await c.end()

  writeFileSync(OUTBOX, '') // start each run with an empty outbox
}
