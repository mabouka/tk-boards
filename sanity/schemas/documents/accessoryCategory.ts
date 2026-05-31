import { defineField, defineType } from 'sanity'

export const accessoryCategory = defineType({
  name: 'accessoryCategory',
  title: 'Accessory Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'internationalizedArrayString',
      description: 'Category name per language, e.g. Fins, Boardbags.',
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
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { name: 'name' },
    prepare({ name }) {
      const title =
        name?.find((n: { language: string; value: string }) => n.language === 'en')?.value ??
        name?.[0]?.value ??
        'Unnamed'
      return { title }
    },
  },
})
