import { describe, expect, it } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { orderItemCountSql } from './order-sql'

// Regression guard for the "0 article" bug: the item-count subquery used to be
// built by interpolating Drizzle columns, which render unqualified inside a SELECT
// projection. The correlated predicate became `"order_id" = "id"`, where "id" bound
// to order_line's own id — so every order reported 0 items.
describe('orderItemCountSql', () => {
  const rendered = new PgDialect().sqlToQuery(orderItemCountSql).sql

  it('correlates against the outer order id', () => {
    expect(rendered).toContain('"order".id')
  })

  it('aliases the line table so its columns are unambiguous', () => {
    expect(rendered).toContain('order_line ol')
    expect(rendered).toContain('ol.order_id')
    expect(rendered).toContain('sum(ol.qty)')
  })

  it('never compares against a bare unqualified id', () => {
    expect(rendered).not.toMatch(/=\s*"id"/)
  })

  it('falls back to 0 and returns an int', () => {
    expect(rendered).toContain('coalesce')
    expect(rendered).toContain('::int')
  })
})
