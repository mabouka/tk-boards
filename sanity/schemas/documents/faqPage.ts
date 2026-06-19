import { defineArrayMember, defineField, defineType } from 'sanity'
import { pageSlugField } from '../../lib/pageSlug'

export const faqPage = defineType({
  name: 'faqPage',
  title: 'FAQ page',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required(), group: 'basic' }),
    pageSlugField('basic'),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      description: 'Big heading shown on the page. Line breaks are preserved. Falls back to Title.',
      type: 'text',
      rows: 2,
      group: 'content',
    }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3, group: 'content' }),
    defineField({
      name: 'categories',
      title: 'Categories',
      description: 'Each category groups its own questions.',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqCategory',
          fields: [
            defineField({
              name: 'title',
              title: 'Category title',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'questions',
              title: 'Questions',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'faqItem',
                  fields: [
                    defineField({ name: 'question', title: 'Question', type: 'string', validation: (r) => r.required() }),
                    defineField({
                      name: 'answer',
                      title: 'Answer',
                      type: 'array',
                      description: 'Rich text — add paragraphs, images and YouTube videos.',
                      validation: (r) => r.required(),
                      of: [
                        defineArrayMember({ type: 'block' }),
                        defineArrayMember({
                          type: 'image',
                          options: { hotspot: true },
                          fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
                        }),
                        defineArrayMember({
                          type: 'object',
                          name: 'youtube',
                          title: 'YouTube video',
                          fields: [
                            defineField({
                              name: 'url',
                              title: 'YouTube URL',
                              type: 'url',
                              description: 'Paste any YouTube link (watch, youtu.be or shorts).',
                              validation: (r) => r.required(),
                            }),
                          ],
                          preview: {
                            select: { url: 'url' },
                            prepare: ({ url }) => ({ title: 'YouTube video', subtitle: url }),
                          },
                        }),
                      ],
                    }),
                  ],
                  preview: { select: { title: 'question' } },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', questions: 'questions' },
            prepare: ({ title, questions }) => ({
              title: title || 'Category',
              subtitle: `${questions?.length ?? 0} question(s)`,
            }),
          },
        }),
      ],
    }),
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 3, group: 'seo' }),
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
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
