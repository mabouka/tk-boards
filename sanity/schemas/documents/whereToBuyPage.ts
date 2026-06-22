import { defineArrayMember, defineField, defineType } from 'sanity'
import { pageSlugField } from '../../lib/pageSlug'
import { withLanguage } from '../../lib/languagePreview'
import { seoFields } from '../../lib/seoFields'

export const whereToBuyPage = defineType({
  name: 'whereToBuyPage',
  title: 'Where to buy page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    pageSlugField(),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
    defineField({
      name: 'stores',
      title: 'Stores',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'store',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'address', title: 'Address', type: 'text', rows: 3 }),
            defineField({ name: 'country', title: 'Country', type: 'string' }),
            defineField({ name: 'url', title: 'Website', type: 'url' }),
          ],
          preview: { select: { title: 'name', subtitle: 'country' } },
        }),
      ],
    }),
    ...seoFields,
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: withLanguage({ select: { title: 'title', subtitle: 'slug.current' } }),
})
