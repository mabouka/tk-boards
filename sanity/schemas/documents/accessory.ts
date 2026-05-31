import { defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'

export const accessory = defineType({
  name: 'accessory',
  title: 'Accessory',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', isUnique: isUniqueSlugPerLanguage },
      validation: (r) => r.required(),
      group: 'basic',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'accessoryCategory' }],
      description: 'Optional — used to group accessories (Fins, Boardbags…).',
      group: 'basic',
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Main description shown on the accessory.',
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
      ],
    }),
    defineField({
      name: 'specifications',
      title: 'Specifications',
      type: 'array',
      description: 'Name/value pairs, e.g. Material → Nylon.',
      group: 'content',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', type: 'string', title: 'Name' }),
            defineField({ name: 'value', type: 'string', title: 'Value' }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'value' },
          },
        },
      ],
    }),
    defineField({
      name: 'sizes',
      title: 'Sizes',
      type: 'array',
      description: 'Optional — e.g. the different sizes available for boardbags.',
      group: 'content',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      description: 'Current price.',
      validation: (r) => r.min(0).precision(2),
      group: 'content',
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price',
      type: 'number',
      description: 'Optional — strike-through price when the item is discounted.',
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
      description: 'Overrides the title in the browser tab and search results.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Shown in search results and social previews.',
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
        defineField({ name: 'alt', title: 'Alt Text', type: 'string' }),
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
      title: 'title',
      categoryName: 'category.name',
      media: 'mainImage',
    },
    prepare({ title, categoryName, media }) {
      const subtitle = Array.isArray(categoryName)
        ? (categoryName.find((n: { _key: string; value: string }) => n._key === 'en')?.value ?? categoryName[0]?.value ?? '')
        : (categoryName ?? '')
      return { title, subtitle, media }
    },
  },
})
