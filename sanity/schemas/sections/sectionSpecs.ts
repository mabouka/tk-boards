import { defineArrayMember, defineField, defineType } from 'sanity'

export const sectionSpecs = defineType({
  name: 'sectionSpecs',
  title: 'Specs table',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'columns',
      title: 'Column headers',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Headers from left to right, e.g. Size, Dimensions, Volume (L), Weight.',
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      validation: (r) => r.min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'specRow',
          fields: [
            defineField({
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              description: 'One value per column, in the same order as the headers.',
              validation: (r) => r.min(1),
            }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }) => ({ title: (cells || []).join('   ·   ') || 'Row' }),
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', columns: 'columns', rows: 'rows' },
    prepare: ({ title, columns, rows }) => ({
      title: title || 'Specs table',
      subtitle: `${columns?.length ?? 0} column(s) · ${rows?.length ?? 0} row(s)`,
    }),
  },
})
