import { defineField, defineType } from 'sanity'

export const sectionTextYoutube = defineType({
  name: 'sectionTextYoutube',
  title: 'Text + YouTube',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'Small uppercase label above the title — ex: FILM',
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
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      description: 'Paste any YouTube link (watch, youtu.be, embed or shorts). Shown 8 columns wide in 16:9.',
      validation: (r) =>
        r
          .required()
          .uri({ scheme: ['http', 'https'] })
          .custom((url) =>
            !url || /(?:youtube\.com|youtu\.be)/.test(url) ? true : 'Must be a YouTube URL'
          ),
    }),
    defineField({
      name: 'poster',
      title: 'Poster image',
      type: 'image',
      options: { hotspot: true },
      description: 'Optional — shown before play. Falls back to the YouTube thumbnail when empty.',
      fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
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
      name: 'videoPosition',
      title: 'Video Position',
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
    select: { title: 'title' },
    prepare: ({ title }) => ({ title: title || 'Text + YouTube', subtitle: 'Text + YouTube' }),
  },
})
