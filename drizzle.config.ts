import { defineConfig } from 'drizzle-kit'

// drizzle-kit auto-loads `.env` but not `.env.local`, where the DB_* vars live.
// Load it explicitly so `drizzle-kit push/studio` can resolve the connection.
try {
  process.loadEnvFile('.env.local')
} catch {
  // .env.local absent (e.g. CI) — vars come straight from the environment.
}

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Direct (unpooled) connection for DDL / migrations.
    url: process.env.DB_DATABASE_URL_UNPOOLED!,
  },
})
