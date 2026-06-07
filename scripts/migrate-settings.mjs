/**
 * One-off migration: split the legacy `siteSettings` singleton into the three
 * new singletons (`seoSettings`, `contactSettings`, `footerSettings`).
 *
 * SEO title/description become internationalized arrays seeded under `en`
 * (add fr/es afterwards in the Studio). The old siteSettings doc is left
 * intact — delete it from the Studio once you've verified the new ones.
 *
 * Run:  node --env-file=.env.local scripts/migrate-settings.mjs
 * Needs SANITY_API_WRITE_TOKEN (Editor) in .env.local.
 */
import { createClient } from '@sanity/client'
import { randomUUID } from 'node:crypto'

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!token) {
    console.error('✗ Missing SANITY_API_WRITE_TOKEN in .env.local')
    process.exit(1)
  }

  const client = createClient({ projectId, dataset, apiVersion: '2025-05-25', token, useCdn: false })

  const iaString = (value) =>
    value ? [{ _key: randomUUID(), _type: 'internationalizedArrayStringValue', language: 'en', value }] : []
  const iaText = (value) =>
    value ? [{ _key: randomUUID(), _type: 'internationalizedArrayTextValue', language: 'en', value }] : []

  const old = await client.getDocument('siteSettings')
  if (!old) {
    console.error('✗ No "siteSettings" document found — nothing to migrate.')
    process.exit(1)
  }

  await client.createOrReplace({
    _id: 'seoSettings',
    _type: 'seoSettings',
    brandName: old.brandName ?? '',
    defaultTitle: iaString(old.siteTitle),
    defaultDescription: iaText(old.seoDescription),
    ...(old.logo ? { logo: old.logo } : {}),
    ...(old.ogImage ? { ogImage: old.ogImage } : {}),
  })

  await client.createOrReplace({
    _id: 'contactSettings',
    _type: 'contactSettings',
    ...(old.contact?.email ? { email: old.contact.email } : {}),
    ...(old.contact?.phone ? { phone: old.contact.phone } : {}),
    ...(old.contact?.address ? { address: old.contact.address } : {}),
  })

  await client.createOrReplace({
    _id: 'footerSettings',
    _type: 'footerSettings',
    ...(old.social ? { social: old.social } : {}),
    ...(old.footer?.copyright ? { copyright: old.footer.copyright } : {}),
    ...(old.footer?.privacyPolicyUrl ? { privacyPolicyUrl: old.footer.privacyPolicyUrl } : {}),
    ...(old.footer?.cookiePolicyUrl ? { cookiePolicyUrl: old.footer.cookiePolicyUrl } : {}),
  })

  console.log('✓ Migrated siteSettings → seoSettings + contactSettings + footerSettings')
  console.log('  SEO title/description seeded under "en" — add fr/es in the Studio.')
  console.log('  The old siteSettings doc is untouched; delete it from the Studio once verified.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
