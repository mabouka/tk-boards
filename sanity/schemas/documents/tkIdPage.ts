import { defineField, defineType } from 'sanity'
import { pageBuilderSections } from '../../lib/pageBuilderSections'
import { withLanguage } from '../../lib/languagePreview'

export const tkIdPage = defineType({
  name: 'tkIdPage',
  title: 'TK ID page',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Basics ──
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
      group: 'basics',
    }),

    // ── Hero ──
    defineField({
      name: 'heroTitle',
      title: 'Hero title',
      type: 'string',
      description: 'Large title over the hero image. Falls back to Title.',
      group: 'hero',
    }),
    defineField({ name: 'heroSubtitle', title: 'Hero subtitle', type: 'string', group: 'hero' }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
      group: 'hero',
    }),

    // ── Content (page builder) ──
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add content sections below the hero.',
      group: 'content',
      of: [...pageBuilderSections],
    }),

    // ── SEO ──
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Social preview image (recommended 1200×630). Falls back to the hero image, then the site default.',
      group: 'seo',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),

    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: withLanguage({ select: { title: 'title', media: 'heroImage' } }),
})
