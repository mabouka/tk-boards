import { defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'

export const board = defineType({
  name: 'board',
  title: 'Board',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
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
      name: 'style',
      title: 'Style',
      type: 'string',
      description: 'e.g. Freestyle, Waves, Freeride',
      group: 'content',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'content',
    }),
    defineField({
      name: 'mainImage',
      title: 'Main Image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'specs',
      title: 'Specs',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Label' }),
            defineField({ name: 'value', type: 'string', title: 'Value' }),
          ],
        },
      ],
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
      description: 'Public price. Leave empty to omit price from search-engine product data.',
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
      description: 'Shown in search results and social previews. Falls back to the tagline.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews (recommended 1200×630). Falls back to the Main Image.',
      group: 'seo',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
      validation: (r) => r.required(),
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      seriesName: 'series.name',
      media: 'mainImage',
    },
    prepare({ title, seriesName, media }) {
      const subtitle = Array.isArray(seriesName)
        ? (seriesName.find((n: { language: string; value: string }) => n.language === 'en')?.value ?? seriesName[0]?.value ?? '')
        : (seriesName ?? '')
      return { title, subtitle, media }
    },
  },
})
