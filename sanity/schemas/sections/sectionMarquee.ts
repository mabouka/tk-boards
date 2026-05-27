import { defineField, defineType } from 'sanity'

export const sectionMarquee = defineType({
  name: 'sectionMarquee',
  title: 'Marquee',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'text',   title: 'Text',        type: 'string' }),
            defineField({ name: 'accent', title: 'Gold accent', type: 'boolean', initialValue: false }),
          ],
          preview: { select: { title: 'text' } },
        },
      ],
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare({ items }) {
      const preview = (items ?? []).map((i: { text: string }) => i.text).join(' · ')
      return { title: 'Marquee', subtitle: preview }
    },
  },
})
