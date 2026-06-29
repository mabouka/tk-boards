import { defineField, defineType } from 'sanity'
import { withLanguage } from '../../lib/languagePreview'
import { pageBuilderSections } from '../../lib/pageBuilderSections'

export const accessoriesPageSettings = defineType({
  name: 'accessoriesPageSettings',
  title: 'Accessories Page Settings',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic', default: true },
    { name: 'content', title: 'Content' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
      description: 'Big heading shown at the top of the /accessories page. Falls back to "Accessories".',
      group: 'basic',
    }),
    defineField({
      name: 'showFilters',
      title: 'Show category filters',
      type: 'boolean',
      initialValue: true,
      description: 'On: show the category filter pills (All / Boardbags / Fins…). Off: hide them and list every accessory.',
      group: 'basic',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [...pageBuilderSections],
      description: 'Extra page-builder sections rendered after the accessory listing.',
      group: 'content',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Title for the /accessories listing page. Falls back to the default "Accessories" label.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Meta description for the /accessories listing page. Falls back to the site default.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews of the /accessories page (recommended 1200×630).',
      group: 'seo',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({ name: 'language', type: 'string', readOnly: true, hidden: true, validation: (r) => r.required() }),
  ],
  // Per-language doc — show the language in the picker so the three are distinct.
  preview: withLanguage({
    select: {},
    prepare: () => ({ title: 'Accessories', subtitle: '/accessories' }),
  }),
})
