import { defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'
import { seoFields } from '../../lib/seoFields'

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', isUnique: isUniqueSlugPerLanguage },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 3 }),
    defineField({ name: 'email', title: 'Email', type: 'string' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'address', title: 'Address', type: 'text', rows: 3 }),
    defineField({ name: 'hours', title: 'Opening hours', type: 'text', rows: 3 }),
    defineField({ name: 'mapUrl', title: 'Map link', type: 'url' }),
    ...seoFields,
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
