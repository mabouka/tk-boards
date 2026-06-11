import { defineField } from 'sanity'
import { isUniqueSlugPerLanguage } from './isUniqueSlugPerLanguage'

// Slugs that collide with a static Next route — a CMS page using one would be
// shadowed by the static route and become silently unreachable. Keep in sync
// with the static segments under app/[locale]/ (site + auth + account groups).
export const RESERVED_SLUGS = [
  'boards',
  'accessories',
  'account',
  'admin',
  'login',
  'forgot-password',
  'reset-password',
  'verify',
  'design-system',
  'tk-id',
  'studio',
]

// Shared slug field for page-like documents: localized uniqueness + a guard
// against reserved (static-route) slugs. Pass a `group` when the schema uses
// field groups (e.g. `page`).
export const pageSlugField = (group?: string) =>
  defineField({
    name: 'slug',
    title: 'Slug',
    type: 'slug',
    options: { source: 'title', isUnique: isUniqueSlugPerLanguage },
    validation: (rule) =>
      rule.required().custom((value?: { current?: string }) => {
        const current = value?.current
        return current && RESERVED_SLUGS.includes(current)
          ? `"${current}" is a reserved route — choose another slug.`
          : true
      }),
    ...(group ? { group } : {}),
  })
