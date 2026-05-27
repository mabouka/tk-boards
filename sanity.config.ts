import { defineConfig } from 'sanity'
import { createClient } from '@sanity/client'
import { structureTool } from 'sanity/structure'
import type { StructureBuilder } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { documentInternationalization } from '@sanity/document-internationalization'
import { internationalizedArray } from 'sanity-plugin-internationalized-array'
import { media } from 'sanity-plugin-media'
import { linkField } from 'sanity-plugin-link-field'
import { schemaTypes } from './sanity/schemas'

const SUPPORTED_LANGUAGES = [
  { id: 'fr', title: 'Français' },
  { id: 'en', title: 'English' },
  { id: 'es', title: 'Español' },
]

export const TRANSLATABLE_TYPES = ['page', 'board']

const studioClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
})

type SeriesEntry = { _id: string; name: string }

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Boards')
        .icon(() => '🏄')
        .child(() =>
          studioClient
            .fetch<SeriesEntry[]>(
              '*[_type == "series" && !(_id in path("drafts.**"))] | order(_createdAt asc) { _id, "name": coalesce(name[language == "en"][0].value, name[0].value) }'
            )
            .then((series) =>
              S.list()
                .title('Boards')
                .items([
                  ...series.map((s) =>
                    S.listItem()
                      .title(s.name ?? s._id)
                      .id(s._id)
                      .icon(() => '🏄')
                      .child(
                        S.documentTypeList('board')
                          .title(s.name ?? s._id)
                          .filter('_type == "board" && series._ref == $seriesId')
                          .params({ seriesId: s._id })
                      )
                  ),
                  S.divider(),
                  S.listItem()
                    .title('Series')
                    .icon(() => '🏷️')
                    .child(S.documentTypeList('series').title('Series')),
                ])
            )
        ),
      S.divider(),
      S.listItem()
        .title('Navigation')
        .icon(() => '🧭')
        .child(
          S.documentTypeList('navigation').title('Navigation')
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
        .icon(() => '⚙️')
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
})
