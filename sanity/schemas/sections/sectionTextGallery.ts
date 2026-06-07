import { defineField, defineType } from 'sanity'

export const sectionTextGallery = defineType({
  name: 'sectionTextGallery',
  title: 'Text + Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Small uppercase label above the title — ex: CORE',
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
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      description: 'Images shown in the large frame. Clicking a thumbnail swaps the main image — the text stays the same.',
      validation: (r) => r.min(1),
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              validation: (r) => r.required(),
            }),
          ],
        },
      ],
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
    select: { title: 'title', media: 'gallery.0', position: 'imagePosition', theme: 'theme' },
    prepare: ({ title, media, position, theme }) => ({
      title: title ?? 'Text + Gallery',
      subtitle: [
        position === 'right' ? 'Image right' : 'Image left',
        theme === 'dark' ? 'Dark' : 'Light',
      ].join(' · '),
      media,
    }),
  },
})
