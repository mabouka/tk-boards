import { defineField, defineType } from 'sanity'

export const sectionTextImageFull = defineType({
  name: 'sectionTextImageFull',
  title: 'Text + Image (Full)',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Small uppercase label above the title — ex: TECHNOLOGY',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
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
      name: 'cta',
      title: 'CTA',
      type: 'link',
      options: { enableText: true },
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
    select: { title: 'title', media: 'image' },
    prepare: ({ title, media }) => ({ title: `${title ?? 'Text + Image (Full)'}`, media }),
  },
})
