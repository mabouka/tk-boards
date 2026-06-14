import { defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required(), group: 'basic' }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: { hotspot: true },
      group: 'content',
    }),
    defineField({ name: 'heroTitle', title: 'Hero Title', type: 'text', rows: 2, group: 'content' }),
    defineField({ name: 'heroSubtitle', title: 'Subtitle', type: 'text', rows: 4, group: 'content' }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
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
      ],
      group: 'content',
    }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews (1200×630). Falls back to the Hero Image, then the site default.',
      group: 'seo',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
    }),
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'title', media: 'heroImage' } },
})
