import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, registrations, units, variants, products, claims, addresses } from '@/db/schema'

export type AccountRow = {
  id: string
  name: string
  email: string
  role: 'customer' | 'admin'
  method: 'password' | 'google'
  createdAt: Date
}

export async function getAccounts(): Promise<AccountRow[]> {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt))
  return rows.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || '—',
    email: u.email,
    role: u.role === 'admin' ? 'admin' : 'customer',
    method: u.passwordHash ? 'password' : 'google',
    createdAt: u.createdAt,
  }))
}

export type AccountDetail = {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  email: string
  role: 'customer' | 'admin'
  method: 'password' | 'google'
  emailVerified: Date | null
  phone: string | null
  locale: string
  createdAt: Date
  boards: {
    registrationId: string
    regStatus: string
    unitStatus: string
    productName: string | null
    sku: string | null
    serial: string | null
    warrantyUntil: Date | null
    createdAt: Date
  }[]
  claims: {
    id: string
    type: string
    status: string
    description: string | null
    productName: string | null
    sku: string | null
    createdAt: Date
  }[]
  addresses: {
    id: string
    line1: string
    line2: string | null
    postalCode: string | null
    city: string | null
    country: string | null
    phone: string | null
    isDefault: boolean
  }[]
}

export async function getAccount(id: string): Promise<AccountDetail | null> {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (!u) return null

  const boards = await db
    .select({
      registrationId: registrations.id,
      regStatus: registrations.status,
      unitStatus: units.status,
      productName: products.name,
      sku: variants.sku,
      serial: units.serial,
      warrantyUntil: registrations.warrantyUntil,
      createdAt: registrations.createdAt,
    })
    .from(registrations)
    .innerJoin(units, eq(units.id, registrations.unitId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(registrations.userId, id))
    .orderBy(desc(registrations.createdAt))

  const userClaims = await db
    .select({
      id: claims.id,
      type: claims.type,
      status: claims.status,
      description: claims.description,
      productName: products.name,
      sku: variants.sku,
      createdAt: claims.createdAt,
    })
    .from(claims)
    .innerJoin(registrations, eq(registrations.id, claims.registrationId))
    .innerJoin(units, eq(units.id, registrations.unitId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(eq(claims.userId, id))
    .orderBy(desc(claims.createdAt))

  const userAddresses = await db
    .select({
      id: addresses.id,
      line1: addresses.line1,
      line2: addresses.line2,
      postalCode: addresses.postalCode,
      city: addresses.city,
      country: addresses.country,
      phone: addresses.phone,
      isDefault: addresses.isDefault,
    })
    .from(addresses)
    .where(eq(addresses.userId, id))
    .orderBy(desc(addresses.isDefault))

  return {
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || '—',
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role === 'admin' ? 'admin' : 'customer',
    method: u.passwordHash ? 'password' : 'google',
    emailVerified: u.emailVerified,
    phone: u.phone,
    locale: u.locale,
    createdAt: u.createdAt,
    boards,
    claims: userClaims,
    addresses: userAddresses,
  }
}
