import { defineArrayMember, defineField, defineType } from 'sanity'

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal name (e.g. "Footer Sitemap")',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'navItem',
          validation: (r) =>
            r.custom((item?: { internalLink?: unknown; externalUrl?: unknown }) => {
              if (item?.internalLink && item?.externalUrl) {
                return 'Use either an internal page or an external URL, not both.'
              }
              return true
            }),
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'internalLink',
              title: 'Internal page',
              type: 'reference',
              to: [{ type: 'page' }],
              description: 'Link to a page — slug updates automatically',
            }),
            defineField({
              name: 'externalUrl',
              title: 'External URL',
              type: 'url',
              description: 'Use only if the destination is not a Sanity page',
            }),
            defineField({
              name: 'openInNewTab',
              title: 'Open in new tab',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'externalUrl' },
            prepare({ title, subtitle }) {
              return { title: title ?? 'Untitled', subtitle: subtitle ?? '→ internal page' }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'language',
      type: 'string',
      readOnly: true,
      hidden: true,
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
