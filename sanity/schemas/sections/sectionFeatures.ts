import { defineArrayMember, defineField, defineType } from 'sanity'

export const sectionFeatures = defineType({
  name: 'sectionFeatures',
  title: 'Features',
  type: 'object',
  fields: [
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
      name: 'items',
      title: 'Features',
      type: 'array',
      description: 'Each feature: an image or video, a title and text, plus an optional button. At least one.',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'feature',
          fields: [
            defineField({
              name: 'mediaType',
              title: 'Media Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Image', value: 'image' },
                  { title: 'Video', value: 'video' },
                ],
                layout: 'radio',
              },
              initialValue: 'image',
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              hidden: ({ parent }) => parent?.mediaType === 'video',
            }),
            defineField({
              name: 'videoUrl',
              title: 'Video MP4 URL',
              type: 'url',
              description: 'Direct MP4 URL — a short, muted, compressed loop.',
              hidden: ({ parent }) => parent?.mediaType !== 'video',
            }),
            defineField({
              name: 'videoPoster',
              title: 'Video poster',
              type: 'image',
              options: { hotspot: true },
              description: 'Shown before the video loads and while it is off-screen.',
              hidden: ({ parent }) => parent?.mediaType !== 'video',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 3,
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'cta',
              title: 'Button (optional)',
              type: 'link',
              options: { enableText: true },
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'mediaType', media: 'image', poster: 'videoPoster' },
            prepare: ({ title, subtitle, media, poster }) => ({
              title: title ?? 'Feature',
              subtitle: subtitle === 'video' ? 'Video' : 'Image',
              media: media ?? poster,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { theme: 'theme', items: 'items' },
    prepare: ({ theme, items }) => ({
      title: 'Features',
      subtitle: `${items?.length ?? 0} item(s) · ${theme ?? 'light'}`,
    }),
  },
})
