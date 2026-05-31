import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import type { StructureBuilder } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { documentInternationalization } from '@sanity/document-internationalization'
import { internationalizedArray } from 'sanity-plugin-internationalized-array'
import { media } from 'sanity-plugin-media'
import { linkField } from 'sanity-plugin-link-field'
import { schemaTypes } from './sanity/schemas'
import { MenuIcon, CogIcon, TagIcon, TagsIcon, PackageIcon, TranslateIcon } from '@sanity/icons'
import { TkIcon } from './sanity/components/TkIcon'

const SUPPORTED_LANGUAGES = [
  { id: 'fr', title: 'Français' },
  { id: 'en', title: 'English' },
  { id: 'es', title: 'Español' },
]

export const TRANSLATABLE_TYPES = ['page', 'board', 'accessory']

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Boards')
        .icon(TkIcon)
        .child(
          S.list()
            .title('Boards')
            .items([
              ...SUPPORTED_LANGUAGES.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .id(`boards-${lang.id}`)
                  .icon(TranslateIcon)
                  .child(
                    S.documentTypeList('board')
                      .title(`Boards — ${lang.title}`)
                      .filter('_type == "board" && language == $lang')
                      .params({ lang: lang.id })
                  )
              ),
              S.divider(),
              S.listItem()
                .title('Series')
                .icon(TagIcon)
                .child(S.documentTypeList('series').title('Series')),
              S.divider(),
              S.listItem()
                .title('Page Settings')
                .icon(CogIcon)
                .child(
                  S.document()
                    .schemaType('boardsPageSettings')
                    .documentId('boardsPageSettings')
                    .title('Boards Page Settings')
                ),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Accessories')
        .icon(PackageIcon)
        .child(
          S.list()
            .title('Accessories')
            .items([
              ...SUPPORTED_LANGUAGES.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .id(`accessories-${lang.id}`)
                  .icon(TranslateIcon)
                  .child(
                    S.documentTypeList('accessory')
                      .title(`Accessories — ${lang.title}`)
                      .filter('_type == "accessory" && language == $lang')
                      .params({ lang: lang.id })
                  )
              ),
              S.divider(),
              S.listItem()
                .title('Categories')
                .icon(TagsIcon)
                .child(S.documentTypeList('accessoryCategory').title('Categories')),
              S.divider(),
              S.listItem()
                .title('Page Settings')
                .icon(CogIcon)
                .child(
                  S.document()
                    .schemaType('accessoriesPageSettings')
                    .documentId('accessoriesPageSettings')
                    .title('Accessories Page Settings')
                ),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Menus')
        .icon(MenuIcon)
        .child(
          S.documentTypeList('navigation').title('Menu')
        ),
      S.divider(),
      S.listItem()
        .title('Pages')
        .child(
          S.documentTypeList('page')
            .title('Pages')
        ),
      S.divider(),
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
    ])

export default defineConfig({
  name: 'tk-boards',
  title: 'TK Boards',
  basePath: '/studio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  plugins: [
    structureTool({ structure }),
    visionTool(),
    media(),
    linkField({
      linkableSchemaTypes: ['page'],
    }),
    documentInternationalization({
      supportedLanguages: SUPPORTED_LANGUAGES,
      schemaTypes: TRANSLATABLE_TYPES,
    }),
    internationalizedArray({
      languages: SUPPORTED_LANGUAGES,
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'text'],
    }),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    // Translated types must be created with a language. The i18n plugin adds
    // per-language templates ("accessory-en", "board-fr", …) that set it; the
    // bare template ("accessory", "board", "page") would create a doc with no
    // language. Remove the bare ones everywhere (global "+" AND pane "+").
    newDocumentOptions: (prev) =>
      prev.filter((item) => !TRANSLATABLE_TYPES.includes(item.templateId)),
  },
})
