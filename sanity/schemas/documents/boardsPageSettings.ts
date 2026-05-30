import { defineField, defineType } from 'sanity'

export const boardsPageSettings = defineType({
  name: 'boardsPageSettings',
  title: 'Boards Page Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'internationalizedArrayString',
      description: 'Title for the /boards listing page, per language. Falls back to the default "Boards" label.',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'internationalizedArrayText',
      description: 'Meta description for the /boards listing page, per language. Falls back to the site default.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews of the /boards page (recommended 1200×630).',
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
    prepare: () => ({ title: 'Boards Page Settings' }),
  },
})
