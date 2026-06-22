import { defineField, defineType } from 'sanity'
import { pageSlugField } from '../../lib/pageSlug'
import { withLanguage } from '../../lib/languagePreview'
import { pageBuilderSections } from '../../lib/pageBuilderSections'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'intro', title: 'Intro' },
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
    pageSlugField('basics'),

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

    // ── Intro ──
    defineField({
      name: 'introEyebrow',
      title: 'Intro eyebrow',
      type: 'string',
      description: 'Small label above the intro title (e.g. "Contact").',
      group: 'intro',
    }),
    defineField({ name: 'introTitle', title: 'Intro title', type: 'text', rows: 2, group: 'intro' }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 6,
      description: 'Body paragraphs — separate each paragraph with a blank line.',
      group: 'intro',
    }),
    // ── Content (page builder) ──
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Add content sections below the form (workshop, text + image, media…).',
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
      description: 'Social preview image (recommended 1200×630). Falls back to the site default.',
      group: 'seo',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),

    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: withLanguage({ select: { title: 'title', subtitle: 'slug.current' } }),
})
