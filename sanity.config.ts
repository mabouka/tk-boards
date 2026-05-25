import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import type { StructureBuilder } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { documentInternationalization } from '@sanity/document-internationalization'
import { media } from 'sanity-plugin-media'
import { schemaTypes } from './sanity/schemas'

const DEFAULT_LANGUAGE = 'en'

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Boards')
        .icon(() => '🏄')
        .child(
          S.list()
            .title('Boards')
            .items([
              S.listItem()
                .title('All Boards')
                .icon(() => '📋')
                .child(
                  S.documentTypeList('board')
                    .title('All Boards')
                    .filter('_type == "board" && language == $lang')
                    .params({ lang: DEFAULT_LANGUAGE })
                ),
              S.listItem()
                .title('Series')
                .icon(() => '🏷️')
                .child(
                  S.documentTypeList('series')
                    .title('Series')
                    .filter('_type == "series" && language == $lang')
                    .params({ lang: DEFAULT_LANGUAGE })
                ),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Pages')
        .child(
          S.documentTypeList('page')
            .title('Pages')
            .filter('_type == "page" && language == $lang')
            .params({ lang: DEFAULT_LANGUAGE })
        ),
      S.divider(),
      S.listItem()
        .title('Site Settings')
        .icon(() => '⚙️')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
    ])

const SUPPORTED_LANGUAGES = [
  { id: 'fr', title: 'Français' },
  { id: 'en', title: 'English' },
  { id: 'es', title: 'Español' },
]

export const TRANSLATABLE_TYPES = ['board', 'series', 'page']

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
    documentInternationalization({
      supportedLanguages: SUPPORTED_LANGUAGES,
      schemaTypes: TRANSLATABLE_TYPES,
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})
