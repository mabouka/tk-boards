import { defineArrayMember, defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'
import { seoFields } from '../../lib/seoFields'

export const faqPage = defineType({
  name: 'faqPage',
  title: 'FAQ page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', isUnique: isUniqueSlugPerLanguage },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: (r) => r.required() }),
            defineField({ name: 'category', title: 'Category', type: 'string', description: 'Optional — groups questions.' }),
          ],
          preview: { select: { title: 'question', subtitle: 'category' } },
        }),
      ],
    }),
    ...seoFields,
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
