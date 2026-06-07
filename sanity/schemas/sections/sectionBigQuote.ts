import { defineField, defineType } from 'sanity'

export const sectionBigQuote = defineType({
  name: 'sectionBigQuote',
  title: 'Big Quote',
  type: 'object',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      description: 'Line breaks are preserved. Quotation marks are added automatically.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'authorName',
      title: 'Author name',
      type: 'string',
    }),
    defineField({
      name: 'authorRole',
      title: 'Author role',
      type: 'string',
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Dark', value: 'dark' },
          { title: 'Light', value: 'light' },
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
    }),
  ],
  preview: {
    select: { quote: 'quote', authorName: 'authorName' },
    prepare: ({ quote, authorName }) => ({
      title: quote ? `“ ${quote.replace(/\s+/g, ' ').slice(0, 42)}…` : 'Big Quote',
      subtitle: authorName,
    }),
  },
})
