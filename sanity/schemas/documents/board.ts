import { defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'

const TAG_STYLES = [
  { title: 'Cream (light fill)', value: 'cream' },
  { title: 'Dark (carbon fill)', value: 'dark' },
  { title: 'Amber (paulownia fill)', value: 'amber' },
  { title: 'Red', value: 'red' },
  { title: 'Outline light', value: 'outline-light' },
  { title: 'Outline muted', value: 'outline-muted' },
]

export const board = defineType({
  name: 'board',
  title: 'Board',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'hero', title: 'Hero' },
    { name: 'presentation', title: 'Presentation' },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    // ── Basic ────────────────────────────────────
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', isUnique: isUniqueSlugPerLanguage },
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'series',
      title: 'Series',
      type: 'reference',
      to: [{ type: 'series' }],
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'skuCode',
      title: 'Model SKU code',
      type: 'string',
      description:
        'Short uppercase code identifying this model, e.g. TK-RKT or TK-TK01. It is the link to variants, physical units (NFC) and the e-shop. Keep it identical across languages.',
      group: 'basic',
      validation: (r) =>
        r
          .required()
          .uppercase()
          .regex(/^[A-Z0-9-]+$/, { name: 'uppercase letters, numbers and dashes' }),
    }),

    // ── Hero ─────────────────────────────────────
    defineField({
      name: 'heroTitle',
      title: 'Title',
      type: 'string',
      description: 'Overrides the board name in the hero. Leave empty to use the board name.',
      group: 'hero',
    }),
    defineField({
      name: 'heroTagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short subtitle shown below the title.',
      group: 'hero',
    }),
    defineField({
      name: 'heroImage',
      title: 'Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-screen background image (action shot, lifestyle…).',
      group: 'hero',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (r) => r.required(),
        }),
      ],
    }),

    // ── Presentation ─────────────────────────────
    defineField({
      name: 'presentationTitle',
      title: 'Title',
      type: 'text',
      rows: 3,
      description: 'Big marketing headline — use line breaks to control wrapping (3 lines displayed).',
      group: 'presentation',
    }),
    defineField({
      name: 'presentationText',
      title: 'Text',
      type: 'array',
      of: [{ type: 'block', styles: [], lists: [], marks: { decorators: [{ title: 'Bold', value: 'strong' }], annotations: [] } }],
      group: 'presentation',
    }),
    defineField({
      name: 'presentationNumbers',
      title: 'Numbers',
      type: 'array',
      description: 'Key figures shown as large specs ( max 4).',
      group: 'presentation',
      validation: (r) => r.max(4),
      of: [
        {
          type: 'object',
          preview: {
            select: { title: 'value', subtitle: 'label' },
            prepare: ({ title, subtitle }) => ({ title: title ?? '—', subtitle }),
          },
          fields: [
            defineField({
              name: 'value',
              title: 'Value',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'unit',
              title: 'Unit',
              type: 'string',
              description: 'Optional — e.g. kg, mm, cm',
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (r) => r.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'presentationTags',
      title: 'Tags',
      type: 'array',
      group: 'presentation',
      of: [
        {
          type: 'object',
          preview: {
            select: { title: 'text', subtitle: 'style' },
            prepare: ({ title, subtitle }) => ({ title: title ?? '—', subtitle }),
          },
          fields: [
            defineField({
              name: 'text',
              title: 'Text',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'style',
              title: 'Style',
              type: 'string',
              options: { list: TAG_STYLES, layout: 'radio' },
              initialValue: 'outline-light',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      description: 'Product images scrolling on the right (first 3 are used).',
      group: 'presentation',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt Text', type: 'string', validation: (r) => r.required() }),
          ],
        },
      ],
    }),

    // ── Content ──────────────────────────────────
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for the boards listing and structured data.',
      group: 'basic',
      fields: [
        defineField({ name: 'alt', title: 'Alt Text', type: 'string', validation: (r) => r.required() }),
      ],
    }),
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      description: 'e.g. Freestyle, Waves, Freeride',
      group: 'content',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Flexible content sections shown below the presentation.',
      of: [
        { type: 'sectionAboutPreview' },
        { type: 'sectionBoards' },
        { type: 'sectionMarquee' },
        { type: 'sectionTextImage' },
        { type: 'sectionTextGallery' },
        { type: 'sectionFullMedia' },
        { type: 'sectionBigQuote' },
        { type: 'sectionMediaLine' },
        { type: 'sectionFeatures' },
        { type: 'sectionOutline' },
      ],
      group: 'content',
    }),
    defineField({
      name: 'weight',
      title: 'Weight (kg)',
      type: 'number',
      group: 'content',
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Public price for structured data. Leave empty to omit.',
      validation: (r) => r.min(0).precision(2),
      group: 'content',
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'EUR',
      options: {
        list: [
          { title: 'Euro (€)', value: 'EUR' },
          { title: 'US Dollar ($)', value: 'USD' },
          { title: 'British Pound (£)', value: 'GBP' },
        ],
        layout: 'radio',
      },
      group: 'content',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'content',
    }),

    // ── SEO ──────────────────────────────────────
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Overrides the board name in the browser tab and search results.',
      group: 'seo',
    }),
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
      description: 'Used for social media previews (1200×630). Falls back to Main Image.',
      group: 'seo',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),

    // ── System ───────────────────────────────────
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', seriesName: 'series.name', media: 'mainImage' },
    prepare({ title, seriesName, media }) {
      const subtitle = Array.isArray(seriesName)
        ? (seriesName.find((n: { language: string; value: string }) => n.language === 'en')?.value ?? seriesName[0]?.value ?? '')
        : (seriesName ?? '')
      return { title, subtitle, media }
    },
  },
})
