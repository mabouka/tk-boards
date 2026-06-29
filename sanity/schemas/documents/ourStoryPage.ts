import { defineField, defineType } from 'sanity'
import { pageSlugField } from '../../lib/pageSlug'
import { withLanguage } from '../../lib/languagePreview'
import { seoFields } from '../../lib/seoFields'
import { pageBuilderSections } from '../../lib/pageBuilderSections'

export const ourStoryPage = defineType({
  name: 'ourStoryPage',
  title: 'Our Story page',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Basic ───────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
      group: 'basic',
    }),
    pageSlugField('basic'),

    // ── Hero (same hero as the board pages) ─────────
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      description: 'Overrides the page title in the hero. Leave empty to use the title.',
      group: 'hero',
    }),
    defineField({
      name: 'heroTagline',
      title: 'Hero Tagline',
      type: 'string',
      description: 'Short subtitle shown below the hero title.',
      group: 'hero',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-screen background image (action shot, lifestyle…), same hero as the board pages.',
      group: 'hero',
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
      ],
    }),

    // ── Content ─────────────────────────────────────
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [...pageBuilderSections],
      description: 'Page-builder sections rendered after the hero (e.g. Big Scroll Text).',
      group: 'content',
    }),

    // ── SEO ─────────────────────────────────────────
    ...seoFields.map((f) => ({ ...f, group: 'seo' })),
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: withLanguage({ select: { title: 'title', subtitle: 'slug.current' } }),
})
