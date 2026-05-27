import { defineField, defineType } from 'sanity'

export const sectionBoards = defineType({
  name: 'sectionBoards',
  title: 'Boards Preview',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Leave empty to use the default translation',
    }),
    defineField({
      name: 'showFilters',
      title: 'Show series filters',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Boards Preview' }),
  },
})
