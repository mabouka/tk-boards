import { defineArrayMember, defineField, defineType } from 'sanity'

export const sectionFixedImage = defineType({
  name: 'sectionFixedImage',
  title: 'Fixed Image',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Images',
      type: 'array',
      description:
        'Each image is a full-screen panel with its own text. As you scroll, the text shows over one image, then the next image appears. At least one.',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fixedImage',
          fields: [
            defineField({
              name: 'image',
              title: 'Background Image',
              type: 'image',
              options: { hotspot: true },
              description: 'Full-bleed image. Stays fixed while scrolling on desktop (scrolls normally on mobile).',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 3,
            }),
            defineField({
              name: 'startColumn',
              title: 'Start column (1–12)',
              type: 'number',
              description: 'Horizontal position of the text block on the 12-column grid.',
              initialValue: 2,
              validation: (r) => r.required().min(1).max(12).integer(),
            }),
            defineField({
              name: 'verticalPosition',
              title: 'Vertical position (0–100)',
              type: 'number',
              description: '0 = top, 50 = middle, 100 = bottom of the screen.',
              initialValue: 70,
              validation: (r) => r.required().min(0).max(100),
            }),
            defineField({
              name: 'cta',
              title: 'Button (optional)',
              type: 'link',
              options: { enableText: true },
            }),
          ],
          preview: {
            select: { title: 'title', media: 'image' },
            prepare: ({ title, media }) => ({
              title: title || 'Image',
              subtitle: 'Fixed background',
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare: ({ items }) => ({
      title: 'Fixed Image',
      subtitle: `${items?.length ?? 0} image(s)`,
    }),
  },
})
