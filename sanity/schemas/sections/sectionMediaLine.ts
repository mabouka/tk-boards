import { defineField, defineType } from 'sanity'

export const sectionMediaLine = defineType({
  name: 'sectionMediaLine',
  title: 'Media Line',
  type: 'object',
  fields: [
    defineField({
      name: 'media',
      title: 'Media items',
      type: 'array',
      description: 'Images and/or videos shown side by side (equal width, shared height).',
      validation: (r) => r.min(1).max(4),
      of: [
        {
          type: 'object',
          name: 'mediaItem',
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
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                  validation: (r) => r.required(),
                }),
              ],
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
              hidden: ({ parent }) => parent?.mediaType !== 'video',
            }),
            defineField({
              name: 'controls',
              title: 'Show video controls',
              type: 'boolean',
              initialValue: false,
              hidden: ({ parent }) => parent?.mediaType !== 'video',
            }),
          ],
          preview: {
            select: { mediaType: 'mediaType', media: 'image' },
            prepare: ({ mediaType, media }) => ({
              title: mediaType === 'video' ? 'Video' : 'Image',
              media,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Item aspect ratio',
      type: 'string',
      description: 'Shared ratio for every item (height follows the column width).',
      options: {
        list: [
          { title: '4:3', value: '4 / 3' },
          { title: '3:2', value: '3 / 2' },
          { title: '1:1 — square', value: '1 / 1' },
          { title: '4:5 — portrait', value: '4 / 5' },
          { title: '16:9', value: '16 / 9' },
        ],
        layout: 'radio',
      },
      initialValue: '4 / 3',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          { title: 'In-grid (gutter margins)', value: 'in-grid' },
          { title: 'Full bleed', value: 'full' },
        ],
        layout: 'radio',
      },
      initialValue: 'in-grid',
    }),
  ],
  preview: {
    select: { media: 'media' },
    prepare: ({ media }) => ({
      title: 'Media Line',
      subtitle: media?.length ? `${media.length} item${media.length > 1 ? 's' : ''}` : 'empty',
    }),
  },
})
