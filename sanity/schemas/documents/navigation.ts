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
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Where this menu appears on the site (like a WordPress menu location).',
      options: {
        layout: 'dropdown',
        list: [
          { title: 'Main menu — Navigation', value: 'header' },
          { title: 'Main menu — Featured boards', value: 'featured' },
          { title: 'Main menu — Legal', value: 'legal' },
          { title: 'Footer', value: 'footer' },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      description: 'Navigation links (for Header / Footer / Legal menus).',
      hidden: ({ document }) => (document as { location?: string })?.location === 'featured',
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
              to: [
                { type: 'page' },
                { type: 'homePage' },
                { type: 'ourStoryPage' },
                { type: 'contactPage' },
                { type: 'faqPage' },
                { type: 'whereToBuyPage' },
                // Product listings: Boards / Accessories index pages (per-language;
                // href resolved in GROQ to /boards and /accessories).
                { type: 'boardsPageSettings' },
                { type: 'accessoriesPageSettings' },
                // User dashboard — href resolved in GROQ to /account.
                { type: 'accountPageSettings' },
              ],
              description: 'Link to a page — slug updates automatically. Only pages in this menu’s language are shown.',
              options: {
                // Pages: same language as the menu. The account dashboard is a
                // single language-independent singleton, so it's always offered.
                filter: ({ document }) => ({
                  filter: '_type == "accountPageSettings" || language == $lang',
                  params: { lang: (document as { language?: string }).language ?? null },
                }),
              },
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
      name: 'featured',
      title: 'Featured boards',
      type: 'array',
      description: 'Highlighted boards on the left of the main menu (its own menu — set Location = Featured boards).',
      hidden: ({ document }) => (document as { location?: string })?.location !== 'featured',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'featuredBoard',
          fields: [
            defineField({
              name: 'board',
              title: 'Board',
              type: 'reference',
              to: [{ type: 'board' }],
              // Only required on Featured-boards menus — otherwise this field is
              // hidden and any leftover items shouldn't block publishing.
              validation: (r) =>
                r.custom((value, context) => {
                  const doc = context.document as { location?: string } | undefined
                  if (doc?.location !== 'featured') return true
                  return value ? true : 'Required'
                }),
            }),
            defineField({
              name: 'image',
              title: 'Background image',
              type: 'image',
              description: 'Shown as the menu background when this board is hovered.',
              validation: (r) =>
                r.custom((value, context) => {
                  const doc = context.document as { location?: string } | undefined
                  if (doc?.location !== 'featured') return true
                  return value ? true : 'Required'
                }),
            }),
          ],
          preview: {
            select: { title: 'board.name', media: 'image' },
            prepare({ title, media }) {
              return { title: title ?? 'Board', media }
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
