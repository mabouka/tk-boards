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
