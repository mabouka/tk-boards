import { sql } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

/** Multilingual label stored inline, e.g. { fr: 'Bleu', en: 'Blue', es: 'Azul' }. */
export type I18nText = Record<string, string>

// ── Auth.js core tables (Drizzle adapter), users extended with app fields ──

export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  // ── app fields ──
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('customer'), // 'customer' | 'admin'
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  onboarded: boolean('onboarded').notNull().default(false),
  locale: text('locale').notNull().default('fr'),
  // Bumped on password reset / "log out everywhere" → old JWTs are rejected by the gates.
  tokenVersion: integer('token_version').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
})

export const accounts = pgTable(
  'account',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (a) => [primaryKey({ columns: [a.provider, a.providerAccountId] })]
)

export const sessions = pgTable('session', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verification_token',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

// Single-use email tokens for credentials flows (verify email, reset password).
// We store a SHA-256 hash of the token, never the raw value.
export const emailTokens = pgTable(
  'email_token',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    type: text('type').notNull(), // 'verify' | 'reset'
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('email_token_hash_uq').on(t.tokenHash),
    index('email_token_user_idx').on(t.userId),
  ]
)

// Fixed-window rate limiting (login, check-email, forgot, resend).
export const rateLimits = pgTable('rate_limit', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
})

// ── Catalogue: products (no master — SKU is the contract with Sanity content) ──

export const products = pgTable(
  'product',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sku: text('sku').notNull(), // parent SKU, e.g. TK-RKT — links to the Sanity page
    name: text('name').notNull(), // internal admin name (marketing lives in Sanity)
    kind: text('kind').notNull(), // 'board' | 'accessory' — admin filter only
    active: boolean('active').notNull().default(true),
    miniConfigurator: boolean('mini_configurator').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (p) => [uniqueIndex('product_sku_uq').on(p.sku)]
)

// ── Catalogue: per-product variant axes (attributes + values) ──

export const productAttributes = pgTable(
  'product_attribute',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    code: text('code').notNull(), // SIZE, COLOR…
    nameI18n: jsonb('name_i18n').$type<I18nText>().notNull(),
    inputType: text('input_type').notNull().default('select'), // 'swatch' | 'select'
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (a) => [index('product_attribute_product_idx').on(a.productId)]
)

export const productAttributeValues = pgTable(
  'product_attribute_value',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    attributeId: text('attribute_id')
      .notNull()
      .references(() => productAttributes.id, { onDelete: 'cascade' }),
    code: text('code').notNull(), // 138, BLU…
    labelI18n: jsonb('label_i18n').$type<I18nText>().notNull(),
    swatchHex: text('swatch_hex'), // #3d6ea5 for colors
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (v) => [index('product_attribute_value_attr_idx').on(v.attributeId)]
)

// ── Catalogue: variants (the sellable unit — everything sellable is a variant) ──

export const variants = pgTable(
  'variant',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull(), // child SKU, e.g. TK-RKT-BLU-138 (= parent for simple products)
    priceEur: numeric('price_eur', { precision: 10, scale: 2 }).notNull(), // base price
    salePriceEur: numeric('sale_price_eur', { precision: 10, scale: 2 }), // promo — NULL = none
    stock: integer('stock').notNull().default(0),
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (v) => [uniqueIndex('variant_sku_uq').on(v.sku), index('variant_product_idx').on(v.productId)]
)

// ── Catalogue: which attribute value a variant has on each axis ──

export const variantValues = pgTable(
  'variant_value',
  {
    variantId: text('variant_id')
      .notNull()
      .references(() => variants.id, { onDelete: 'cascade' }),
    attributeId: text('attribute_id')
      .notNull()
      .references(() => productAttributes.id, { onDelete: 'cascade' }),
    valueId: text('value_id')
      .notNull()
      .references(() => productAttributeValues.id, { onDelete: 'cascade' }),
  },
  (vv) => [primaryKey({ columns: [vv.variantId, vv.attributeId] })] // one value per axis
)

// ── Catalogue: paid add-ons (generic, per product) ──

export const productOptions = pgTable(
  'product_option',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    nameI18n: jsonb('name_i18n').$type<I18nText>().notNull(), // "Ailerons carbone"
    groupLabelI18n: jsonb('group_label_i18n').$type<I18nText>(), // optional grouping
    priceDeltaEur: numeric('price_delta_eur', { precision: 10, scale: 2 }).notNull(), // +75.00
    sku: text('sku'), // optional, e.g. TK-RKT-FIN-CARBON
    stock: integer('stock'), // NULL = not tracked
    active: boolean('active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (o) => [
    uniqueIndex('product_option_sku_uq').on(o.sku),
    index('product_option_product_idx').on(o.productId),
  ]
)

// ── Catalogue: related products (cross-sell / joint purchase) ──

export const productLinks = pgTable(
  'product_link',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    linkedProductId: text('linked_product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'achat_conjoint' | 'cross_sell' | 'accessoire'
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (l) => [
    uniqueIndex('product_link_uq').on(l.productId, l.linkedProductId, l.type),
    index('product_link_product_idx').on(l.productId),
  ]
)

// ── Production: physical units (NFC token → variant + serial), serialized ──

export const units = pgTable(
  'unit',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    token: text('token').notNull(), // opaque, in the NFC tag
    variantId: text('variant_id').references(() => variants.id, { onDelete: 'set null' }),
    serial: text('serial'),
    status: text('status').notNull().default('minted'), // minted|provisioned|registered|stolen|transferred
    // Owner-provided lost/stolen report, shown on the public TK-ID page; cleared on recovery.
    lostNote: text('lost_note'),
    lostEmail: text('lost_email'),
    lostPhone: text('lost_phone'),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (u) => [uniqueIndex('unit_token_uq').on(u.token), uniqueIndex('unit_serial_uq').on(u.serial)]
)

// ── Member area: registrations + claims + addresses ──

export const registrations = pgTable(
  'registration',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    purchasedAt: timestamp('purchased_at', { mode: 'date' }),
    purchaseProof: text('purchase_proof'), // storage key
    warrantyUntil: timestamp('warranty_until', { mode: 'date' }),
    status: text('status').notNull().default('active'), // active|stolen|transferred
    contactPublic: boolean('contact_public').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (r) => [
    index('registration_user_idx').on(r.userId),
    // First-tap-wins: at most one ACTIVE registration per physical unit.
    uniqueIndex('registration_active_unit_uq').on(r.unitId).where(sql`status = 'active'`),
  ]
)

export const claims = pgTable('claim', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  registrationId: text('registration_id')
    .notNull()
    .references(() => registrations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // theft|warranty
  description: text('description'),
  photoPaths: text('photo_paths').array().notNull().default(sql`'{}'`),
  status: text('status').notNull().default('open'), // open|in_review|resolved|rejected
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const addresses = pgTable('address', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label'), // e.g. "Domicile", "Spot préféré"
  company: text('company'), // optional business name
  line1: text('line1').notNull(),
  line2: text('line2'),
  postalCode: text('postal_code'),
  city: text('city'),
  country: text('country'),
  phone: text('phone'),
  isDefault: boolean('is_default').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

// Ownership transfer: the owner invites an email; the recipient accepts via a
// tokenised email link (only that email can accept). The raw token lives in the
// link — we store its SHA-256 hash only.
export const transfers = pgTable(
  'transfer',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id, { onDelete: 'cascade' }),
    fromUserId: text('from_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    toEmail: text('to_email').notNull(),
    tokenHash: text('token_hash').notNull(),
    status: text('status').notNull().default('pending'), // pending|accepted|cancelled|expired
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('transfer_token_uq').on(t.tokenHash), index('transfer_unit_idx').on(t.unitId)]
)
