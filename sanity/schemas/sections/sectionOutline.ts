import { defineArrayMember, defineField, defineType } from 'sanity'

export const sectionOutline = defineType({
  name: 'sectionOutline',
  title: 'Outline',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      initialValue: 'Outline',
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
      name: 'intro',
      title: 'Intro',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'milestones',
      title: 'Milestones',
      type: 'array',
      description: 'Eras of the shape evolution — revealed one by one as the section scrolls. At least one.',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'milestone',
          fields: [
            defineField({ name: 'year', title: 'Year', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'tag', title: 'Tag', type: 'string', description: 'Short note shown on the right of the row.' }),
            defineField({
              name: 'svgPath',
              title: 'Outline SVG path',
              type: 'text',
              rows: 3,
              description: 'The board outline as an SVG path `d`, drawn in a shared `0 0 100 300` viewBox.',
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'year' },
            prepare: ({ title, subtitle }) => ({ title: title ?? 'Milestone', subtitle }),
          },
        }),
      ],
    }),
    defineField({
      name: 'finalImage',
      title: 'Final photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Board photo revealed at the end of the scroll.',
    }),
    defineField({ name: 'finalLabelTitle', title: 'Final label — title', type: 'string' }),
    defineField({ name: 'finalLabelSubtitle', title: 'Final label — subtitle', type: 'string' }),
  ],
  preview: {
    select: { title: 'title', milestones: 'milestones' },
    prepare: ({ title, milestones }) => ({
      title: 'Outline',
      subtitle: (title?.split('\n')[0] ?? `${milestones?.length ?? 0} milestones`),
    }),
  },
})
