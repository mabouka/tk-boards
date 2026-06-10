import { neon } from '@neondatabase/serverless'
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const url = process.env.DB_DATABASE_URL!

// Prod/dev use neon() over HTTP — lazy per-query (no connection held), safe at import.
// E2E/local can set DB_DRIVER=pg to point the app at a plain Postgres via
// node-postgres; `pg` is required lazily so the neon path never bundles it.
function createDb(): NeonHttpDatabase<typeof schema> {
  if (process.env.DB_DRIVER === 'pg') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy server-only driver
    const { Pool } = require('pg')
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy server-only driver
    const { drizzle: drizzlePg } = require('drizzle-orm/node-postgres')
    return drizzlePg(new Pool({ connectionString: url }), { schema }) as unknown as NeonHttpDatabase<
      typeof schema
    >
  }
  return drizzle(neon(url), { schema })
}

export const db = createDb()
