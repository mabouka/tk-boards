import { defineField, defineType } from 'sanity'

export const sectionTextImage = defineType({
  name: 'sectionTextImage',
  title: 'Text + Image',
  type: 'object',
  fields: [
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Full — image bleed to edge', value: 'full' },
          { title: 'Contained — image inset', value: 'contained' },
        ],
        layout: 'radio',
      },
      initialValue: 'full',
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Small uppercase label above the title — ex: TECHNOLOGY',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'text',
      rows: 2,
      description: 'Use a line break (Enter) to control where the title wraps.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Force image aspect ratio',
      type: 'string',
      description: 'Optional — overrides the image’s natural ratio. Leave empty to keep the original.',
      options: {
        list: [
          { title: '1:1 — square', value: '1 / 1' },
          { title: '4:3', value: '4 / 3' },
          { title: '3:2', value: '3 / 2' },
          { title: '4:5 — portrait', value: '4 / 5' },
          { title: '16:9', value: '16 / 9' },
        ],
      },
    }),
    defineField({
      name: 'ctas',
      title: 'CTAs',
      type: 'array',
      of: [{ type: 'link', options: { enableText: true } }],
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'string',
      options: {
        list: [
          { title: 'Light', value: 'light' },
          { title: 'Dark', value: 'dark' },
        ],
        layout: 'radio',
      },
      initialValue: 'light',
    }),
    defineField({
      name: 'imagePosition',
      title: 'Image Position',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
      initialValue: 'left',
    }),
  ],
  preview: {
    select: { title: 'title', media: 'image', layout: 'layout' },
    prepare: ({ title, media, layout }) => ({
      title: title ?? 'Text + Image',
      subtitle: layout === 'contained' ? 'Contained' : 'Full',
      media,
    }),
  },
})
