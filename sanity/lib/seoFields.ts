import { defineField } from 'sanity'

// Shared SEO fields for page-like documents. Consumed by the polymorphic
// [slug] route's generateMetadata (via cmsPageBySlugQuery). Kept flat (no group)
// so it can be spread into any schema; falls back to site defaults when empty.
export const seoFields = [
  defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string' }),
  defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 3 }),
  defineField({
    name: 'ogImage',
    title: 'Social Share Image',
    type: 'image',
    options: { hotspot: true },
    description: 'Social preview image (recommended 1200×630). Falls back to the site default.',
    fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
  }),
]
