import { defineField, defineType } from 'sanity'

export const seoSettings = defineType({
  name: 'seoSettings',
  title: 'SEO',
  type: 'document',
  fields: [
    defineField({
      name: 'brandName',
      title: 'Brand Name',
      type: 'string',
      description:
        'The brand’s proper name, e.g. “TK Boards”. Used for the browser-tab suffix, social previews and Schema.org. Same in every language.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'defaultTitle',
      title: 'Default Page Title',
      type: 'internationalizedArrayString',
      description:
        'Default <title> per language, for the homepage and any page with no SEO title of its own.',
    }),
    defineField({
      name: 'defaultDescription',
      title: 'Default SEO Description',
      type: 'internationalizedArrayText',
      description:
        'Default meta description per language, used when a page or board has none of its own.',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: { hotspot: true },
      description:
        'Brand logo for search engines (Schema.org). Square or rectangular on a transparent background recommended.',
      validation: (r) => r.required(),
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({
      name: 'ogImage',
      title: 'Default Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description:
        'Fallback for social previews when a page or board has no image of its own (recommended 1200×630).',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
  ],
  preview: { prepare: () => ({ title: 'SEO' }) },
})
