import { defineArrayMember, defineField, defineType } from 'sanity'

export const sectionScrollImage = defineType({
  name: 'sectionScrollImage',
  title: 'Scroll Image',
  type: 'object',
  fields: [
    defineField({
      name: 'items',
      title: 'Images',
      type: 'array',
      description:
        'Staggered, overlapping images that drift at different speeds as you scroll (parallax). Add 2+ images, give them overlapping columns and different speeds for the effect. Later images stack on top.',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'scrollImage',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              validation: (r) => r.required(),
              fields: [defineField({ name: 'alt', title: 'Alt Text', type: 'string' })],
            }),
            defineField({
              name: 'startColumn',
              title: 'Start column (1–12)',
              type: 'number',
              description: 'Horizontal position on the 12-column grid.',
              initialValue: 1,
              validation: (r) => r.required().min(1).max(12).integer(),
            }),
            defineField({
              name: 'widthColumns',
              title: 'Width (columns, 1–12)',
              type: 'number',
              description: 'Image width in grid columns.',
              initialValue: 6,
              validation: (r) => r.required().min(1).max(12).integer(),
            }),
            defineField({
              name: 'offsetY',
              title: 'Vertical offset (vh)',
              type: 'number',
              description: 'Pushes the image down to create the stagger. 0 = aligned to the top.',
              initialValue: 0,
              validation: (r) => r.min(-50).max(150),
            }),
            defineField({
              name: 'speed',
              title: 'Parallax speed (-1 to 1)',
              type: 'number',
              description:
                '0 = static. Vary it between images for the different-speed effect (e.g. 0.2 and 0.7). Negative reverses the direction.',
              initialValue: 0.4,
              validation: (r) => r.required().min(-1).max(1),
            }),
          ],
          preview: {
            select: { media: 'image', start: 'startColumn', width: 'widthColumns', speed: 'speed' },
            prepare: ({ media, start, width, speed }) => ({
              title: `Col ${start ?? '?'} · ${width ?? '?'} wide`,
              subtitle: `Parallax ${speed ?? 0}`,
              media,
            }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { items: 'items' },
    prepare: ({ items }) => ({ title: 'Scroll Image', subtitle: `${items?.length ?? 0} image(s)` }),
  },
})
