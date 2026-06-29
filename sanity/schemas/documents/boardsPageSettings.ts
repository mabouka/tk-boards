import { defineField, defineType } from 'sanity'
import { pageBuilderSections } from '../../lib/pageBuilderSections'
import { withLanguage } from '../../lib/languagePreview'

export const boardsPageSettings = defineType({
  name: 'boardsPageSettings',
  title: 'Boards Page Settings',
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
      description: 'Big heading shown at the top of the /boards page. Falls back to "Boards".',
      group: 'basic',
    }),
    defineField({
      name: 'groupBySeries',
      title: 'Group boards by series',
      type: 'boolean',
      initialValue: true,
      description:
        'On: a titled section per series (Carbon, Tiki…), each with its description. Off: every board in one grid.',
      group: 'basic',
    }),
    defineField({
      name: 'marquee',
      title: 'Marquee (between series)',
      type: 'sectionMarquee',
      description: 'Scrolling band shown between the series. Only appears when boards are grouped by series.',
      group: 'basic',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [...pageBuilderSections],
      description: 'Extra page-builder sections rendered after the board listing.',
      group: 'content',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO Title',
      type: 'string',
      description: 'Title for the /boards listing page. Falls back to the default "Boards" label.',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO Description',
      type: 'text',
      rows: 3,
      description: 'Meta description for the /boards listing page. Falls back to the site default.',
      group: 'seo',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social Share Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Used for social media previews of the /boards page (recommended 1200×630).',
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
    prepare: () => ({ title: 'Boards', subtitle: '/boards' }),
  }),
})
