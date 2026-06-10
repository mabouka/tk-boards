import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { units, variants, products, registrations } from '@/db/schema'

export type TkId = {
  unitId: string
  token: string
  serial: string | null
  status: string
  variantId: string | null
  productName: string | null
  variantSku: string | null
  ownerUserId: string | null
  contactPublic: boolean
}

export async function getUnitByToken(token: string): Promise<TkId | null> {
  if (!token) return null

  const [u] = await db
    .select({
      unitId: units.id,
      token: units.token,
      serial: units.serial,
      status: units.status,
      variantId: units.variantId,
      productName: products.name,
      variantSku: variants.sku,
    })
    .from(units)
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(units.token, token))
    .limit(1)

  if (!u) return null

  const [reg] = await db
    .select({ userId: registrations.userId, contactPublic: registrations.contactPublic })
    .from(registrations)
    .where(and(eq(registrations.unitId, u.unitId), eq(registrations.status, 'active')))
    .limit(1)

  return {
    ...u,
    ownerUserId: reg?.userId ?? null,
    contactPublic: reg?.contactPublic ?? false,
  }
}
