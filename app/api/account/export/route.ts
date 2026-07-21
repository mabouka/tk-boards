import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import {
  users,
  addresses as addressesTable,
  registrations,
  units,
  variants,
  products,
} from '@/db/schema'
import { liveSession } from '@/lib/session'

const LOCALES = ['fr', 'en', 'es'] as const
const HEADER: Record<string, [string, string, string]> = {
  fr: ['Section', 'Champ', 'Valeur'],
  en: ['Section', 'Field', 'Value'],
  es: ['Sección', 'Campo', 'Valor'],
}
const REGISTERED_ON: Record<string, string> = {
  fr: 'Enregistrée le',
  en: 'Registered on',
  es: 'Registrada el',
}

// GDPR data export — the signed-in user downloads all of their personal data as
// a CSV (section, field, value). Lives under /api (outside the [locale] segment),
// so labels are resolved by importing the message bundle directly rather than via
// getTranslations (which has no locale context here). Access is gated by session.
export async function GET(req: Request) {
  const sess = await liveSession()
  if (!sess) return new Response('Unauthorized', { status: 401 })

  const raw = new URL(req.url).searchParams.get('locale') ?? 'en'
  const locale = (LOCALES as readonly string[]).includes(raw) ? raw : 'en'
  const m = (await import(`../../../../messages/${locale}.json`)).default as {
    account: Record<string, string>
    tkid: Record<string, string>
  }
  const t = (k: string) => m.account[k] ?? k
  const tk = (k: string) => m.tkid[k] ?? k

  const [u] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      locale: users.locale,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, sess.userId))
    .limit(1)

  const addrs = await db
    .select({
      label: addressesTable.label,
      line1: addressesTable.line1,
      line2: addressesTable.line2,
      postalCode: addressesTable.postalCode,
      city: addressesTable.city,
      country: addressesTable.country,
      phone: addressesTable.phone,
      isDefault: addressesTable.isDefault,
    })
    .from(addressesTable)
    .where(eq(addressesTable.userId, sess.userId))
    .orderBy(desc(addressesTable.isDefault), asc(addressesTable.createdAt))

  const boards = await db
    .select({
      productName: products.name,
      sku: variants.sku,
      serial: units.serial,
      status: units.status,
      registeredAt: registrations.createdAt,
    })
    .from(registrations)
    .innerJoin(units, eq(units.id, registrations.unitId))
    .leftJoin(variants, eq(variants.id, units.variantId))
    .leftJoin(products, eq(products.id, variants.productId))
    .where(and(eq(registrations.userId, sess.userId), eq(registrations.status, 'active')))
    .orderBy(desc(registrations.createdAt))

  const fmtDate = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : '')

  // ── Build the (section, field, value) rows ──
  const rows: [string, string, string][] = []
  const profile = t('identity')
  rows.push([profile, t('first_name'), u?.firstName ?? ''])
  rows.push([profile, t('last_name'), u?.lastName ?? ''])
  rows.push([profile, t('email_label'), u?.email ?? ''])
  rows.push([profile, t('phone'), u?.phone ?? ''])
  rows.push([profile, t('member_since'), fmtDate(u?.createdAt ?? null)])

  addrs.forEach((a, i) => {
    const s = `${t('address')} ${i + 1}${a.isDefault ? ` (${t('default')})` : ''}`
    rows.push([s, t('address_label'), a.label ?? ''])
    rows.push([s, t('address_line1'), a.line1])
    rows.push([s, t('address_line2'), a.line2 ?? ''])
    rows.push([s, t('address_postal'), a.postalCode ?? ''])
    rows.push([s, t('address_city'), a.city ?? ''])
    rows.push([s, t('address_country'), a.country ?? ''])
    rows.push([s, t('phone'), a.phone ?? ''])
  })

  boards.forEach((b, i) => {
    const s = `Board ${i + 1}`
    rows.push([s, tk('model_label'), b.productName ?? ''])
    rows.push([s, tk('serial_label'), b.serial ?? ''])
    rows.push([s, 'SKU', b.sku ?? ''])
    rows.push([s, REGISTERED_ON[locale], fmtDate(b.registeredAt)])
  })

  // CSV escape + neutralize spreadsheet formula injection: a cell that starts
  // with = + - @ (or tab/CR) is prefixed with ' so Excel/Sheets treat it as text.
  const esc = (v: string) => {
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v
    return `"${safe.replace(/"/g, '""')}"`
  }
  const csv = [HEADER[locale], ...rows].map((r) => r.map(esc).join(',')).join('\r\n')

  // Leading BOM (﻿) so Excel reads UTF-8 correctly.
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tk-boards-data.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
