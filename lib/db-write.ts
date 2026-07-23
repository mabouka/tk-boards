import type { BatchItem } from 'drizzle-orm/batch'
import type { AnyPgDatabase } from '@/lib/db-types'

/**
 * Run several statements as one unit on whichever driver we're given.
 *
 * neon-http has no interactive transactions but does have `batch`; node-postgres
 * (used by the integration harness) has `transaction` but no `batch`. Statements
 * are built *from the passed client* rather than pre-built, because a drizzle query
 * builder is bound to the client that created it and can't be replayed inside
 * someone else's transaction.
 *
 * Lives here rather than beside one caller: "neon-http can't do transactions" is a
 * property of the driver, not of orders or of transfers, and every multi-row write
 * in the app needs the same answer.
 */
export async function writeAtomically(
  database: AnyPgDatabase,
  build: (client: AnyPgDatabase) => BatchItem<'pg'>[]
): Promise<void> {
  const batchable = database as unknown as {
    batch?: (stmts: [BatchItem<'pg'>, ...BatchItem<'pg'>[]]) => Promise<unknown>
  }
  if (typeof batchable.batch === 'function') {
    await batchable.batch(build(database) as [BatchItem<'pg'>, ...BatchItem<'pg'>[]])
    return
  }
  await database.transaction(async (tx) => {
    for (const stmt of build(tx as unknown as AnyPgDatabase)) await stmt
  })
}
