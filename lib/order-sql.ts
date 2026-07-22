import { sql } from 'drizzle-orm'

/**
 * Total number of items in an order, as a correlated subquery.
 *
 * Written out literally rather than built with `${orderLines.qty}`-style
 * interpolation: inside a SELECT projection Drizzle renders columns *unqualified*,
 * so the correlated predicate came out as `"order_id" = "id"` — and `"id"` bound to
 * order_line's own id column instead of the outer order's, making every count 0.
 * Aliasing the inner table (`ol`) and naming the outer one (`"order".id`) keeps the
 * reference unambiguous.
 */
export const orderItemCountSql = sql<number>`(select coalesce(sum(ol.qty), 0) from order_line ol where ol.order_id = "order".id)::int`
