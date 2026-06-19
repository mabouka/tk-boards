import { defineField, defineType } from 'sanity'

export const sectionCenteredText = defineType({
  name: 'sectionCenteredText',
  title: 'Centered text',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'text',
      rows: 2,
      description: 'Optional — line breaks are preserved.',
    }),
    defineField({
      name: 'body',
      title: 'Text',
      type: 'array',
      of: [{ type: 'block' }],
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: title || 'Centered text', subtitle: 'Centered text' }),
  },
})
