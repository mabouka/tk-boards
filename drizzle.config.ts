import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Direct (unpooled) connection for DDL / migrations.
    url: process.env.DB_DATABASE_URL_UNPOOLED!,
  },
})
