import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { inject } from 'vitest'
import * as schema from '@/db/schema'

// Type the value provided by global-setup so inject() is type-safe.
declare module 'vitest' {
  interface ProvidedContext {
    connectionString: string
  }
}

// Build a node-postgres drizzle client against the test container. max:1 keeps
// every statement on one connection so a multi-statement persist (no transaction
// under neon-http) is read-consistent within a test.
export function makeTestDb() {
  const pool = new Pool({ connectionString: inject('connectionString'), max: 1 })
  const db = drizzle(pool, { schema })
  return { db, pool }
}

// Every table, child-first not required thanks to CASCADE. Reset between tests.
const TABLES = [
  'product',
  '"user"',
  'unit',
  'registration',
  'variant',
  'variant_value',
  'product_attribute',
  'product_attribute_value',
  'product_option',
  'product_link',
  'claim',
  'address',
  'email_token',
  'rate_limit',
  'session',
  'account',
  'verification_token',
]

export async function truncateAll(pool: Pool) {
  await pool.query(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`)
}
