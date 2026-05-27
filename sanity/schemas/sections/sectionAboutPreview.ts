import { defineField, defineType } from 'sanity'

export const sectionAboutPreview = defineType({
  name: 'sectionAboutPreview',
  title: 'About Preview',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      initialValue: 'THE TK PHILOSOPHY',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      description: 'Entrée pour les sauts de ligne',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block', styles: [], lists: [], marks: { decorators: [{ title: 'Bold', value: 'strong' }], annotations: [] } }],
    }),
    defineField({
      name: 'cta',
      title: 'CTA',
      type: 'link',
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return { title: 'About Preview', subtitle: title }
    },
  },
})
