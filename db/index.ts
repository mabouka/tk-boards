import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// neon() over HTTP is lazy per-query (no connection held), so this is safe at
// import. DB_DATABASE_URL must be present at build/run (dev: .env.development.local,
// local build: .env.local, prod: Vercel env).
const sql = neon(process.env.DB_DATABASE_URL!)

export const db = drizzle(sql, { schema })
