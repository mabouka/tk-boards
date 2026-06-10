import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { claims, registrations, units, variants, products, users } from '@/db/schema'

export type ClaimRow = {
  id: string
  type: string // theft | warranty
  status: string // open | in_review | resolved | rejected
  description: string | null
  photoCount: number
  createdAt: Date
  ownerName: string
  ownerEmail: string
  productName: string | null
  sku: string | null
  serial: string | null
}

// Claims of a given type (warranty/theft), newest first, with their owner + board
// joined for the admin queue. Omit `type` to get every claim.
export async function getClaims(type?: 'theft' | 'warranty'): Promise<ClaimRow[]> {
  const rows = await db
    .select({
      id: claims.id,
      type: claims.type,
      status: claims.status,
      description: claims.description,
      photoPaths: claims.photoPaths,
      createdAt: claims.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      name: users.name,
      email: users.email,
      productName: products.name,
      sku: variants.sku,
      serial: units.serial,
    })
    .from(claims)
    .innerJoin(users, eq(users.id, claims.userId))
    .innerJoin(registrations, eq(registrations.id, claims.registrationId))
    .innerJoin(units, eq(units.id, registrations.unitId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(type ? eq(claims.type, type) : undefined)
    .orderBy(desc(claims.createdAt))

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    description: r.description,
    photoCount: r.photoPaths?.length ?? 0,
    createdAt: r.createdAt,
    ownerName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.name || '—',
    ownerEmail: r.email,
    productName: r.productName,
    sku: r.sku,
    serial: r.serial,
  }))
}
