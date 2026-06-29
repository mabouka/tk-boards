import { defineField, defineType } from 'sanity'

export const sectionBigScrollText = defineType({
  name: 'sectionBigScrollText',
  title: 'Big Scroll Text',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 4,
      description:
        'Large uppercase intro text. Each word brightens from grey to white as the visitor scrolls past. Line breaks are preserved.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare: ({ text }) => ({ title: text || 'Big Scroll Text', subtitle: 'Big Scroll Text' }),
  },
})
