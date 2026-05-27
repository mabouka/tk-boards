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
    defineField({
      name: 'tagVariant',
      title: 'Tag Color',
      type: 'string',
      options: {
        list: [
          { title: 'Dark (default)', value: 'dark' },
          { title: 'Amber', value: 'amber' },
          { title: 'Cream', value: 'cream' },
          { title: 'Red', value: 'red' },
          { title: 'Outline light', value: 'outline-light' },
          { title: 'Outline muted', value: 'outline-muted' },
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
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
