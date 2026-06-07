import { defineField, defineType } from 'sanity'

export const sectionFullMedia = defineType({
  name: 'sectionFullMedia',
  title: 'Full Media',
  type: 'object',
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
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          { title: 'Full bleed', value: 'full' },
          { title: 'In-grid (gutter margins)', value: 'in-grid' },
        ],
        layout: 'radio',
      },
      initialValue: 'full',
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
      description: 'Shown before the video loads and while it is off-screen.',
      hidden: ({ parent }) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoWidth',
      title: 'Video width (px)',
      type: 'number',
      description: 'The video’s pixel dimensions set the section ratio (height = width ÷ ratio).',
      validation: (r) => r.positive(),
      hidden: ({ parent }) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'videoHeight',
      title: 'Video height (px)',
      type: 'number',
      validation: (r) => r.positive(),
      hidden: ({ parent }) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'controls',
      title: 'Show video controls',
      type: 'boolean',
      description: 'On = a player with controls and sound. Off = silent autoplay loop (background).',
      initialValue: false,
      hidden: ({ parent }) => parent?.mediaType !== 'video',
    }),
  ],
  preview: {
    select: { mediaType: 'mediaType', media: 'image' },
    prepare: ({ mediaType, media }) => ({
      title: mediaType === 'video' ? 'Full Media — Video' : 'Full Media — Image',
      media,
    }),
  },
})
