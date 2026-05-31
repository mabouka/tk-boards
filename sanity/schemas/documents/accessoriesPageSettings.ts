import { defineField, defineType } from 'sanity'

export const accessoriesPageSettings = defineType({
  name: 'accessoriesPageSettings',
  title: 'Accessories Page Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'internationalizedArrayString',
      description: 'Title for the /accessories listing page, per language. Falls back to the default "Accessories" label.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'internationalizedArrayText',
      description: 'Meta description for the /accessories listing page, per language. Falls back to the site default.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews of the /accessories page (recommended 1200×630).',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Accessories Page Settings' }),
  },
})
