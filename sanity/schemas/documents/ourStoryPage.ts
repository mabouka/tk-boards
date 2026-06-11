import { defineArrayMember, defineField, defineType } from 'sanity'
import { isUniqueSlugPerLanguage } from '../../lib/isUniqueSlugPerLanguage'
import { seoFields } from '../../lib/seoFields'

export const ourStoryPage = defineType({
  name: 'ourStoryPage',
  title: 'Our Story page',
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
    defineField({ name: 'intro', title: 'Intro', type: 'text', rows: 4 }),
    defineField({
      name: 'blocks',
      title: 'Story blocks',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'storyBlock',
          fields: [
            defineField({ name: 'heading', title: 'Heading', type: 'string' }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 4 }),
            defineField({ name: 'image', title: 'Image', type: 'image', options: { hotspot: true } }),
          ],
          preview: { select: { title: 'heading', media: 'image' } },
        }),
      ],
    }),
    defineField({
      name: 'keyFigures',
      title: 'Key figures',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'figure',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        }),
      ],
    }),
    ...seoFields,
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
