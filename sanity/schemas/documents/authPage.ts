import { defineField, defineType } from 'sanity'

export const authPage = defineType({
  name: 'authPage',
  title: 'Login / TK ID Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'internationalizedArrayText',
      description: 'Big headline on the left panel. Line breaks become new lines (e.g. “Own it.\nProtect it.\nRide it.”).',
      group: 'content',
    }),
    defineField({
      name: 'paragraph',
      title: 'Paragraph',
      type: 'internationalizedArrayText',
      description: 'Short paragraph under the tagline.',
      group: 'content',
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background image (left panel)',
      type: 'image',
      options: { hotspot: true },
      description:
        'Full-bleed photo behind the tagline on the login page. A dark overlay is applied automatically for legibility.',
      group: 'content',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'internationalizedArrayString',
      description: 'Title for the /login page, per language.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'internationalizedArrayText',
      description: 'Meta description for the /login page, per language.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      group: 'seo',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Login / TK ID Page' }) },
})
