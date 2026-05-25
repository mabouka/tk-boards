import { defineField, defineType } from 'sanity'

export const series = defineType({
  name: 'series',
  title: 'Series',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.0.value' },
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { name: 'name' },
    prepare({ name }) {
      const title =
        name?.find((n: { _key: string; value: string }) => n._key === 'en')?.value ??
        name?.[0]?.value ??
        'Unnamed'
      return { title }
    },
  },
})
