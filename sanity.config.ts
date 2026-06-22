import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import type { StructureBuilder } from 'sanity/structure'
import { presentationTool, defineLocations } from 'sanity/presentation'
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

// Required by Sanity for document-type lists that use a custom GROQ filter.
const API_VERSION = '2025-05-25'

export const TRANSLATABLE_TYPES = [
  'page',
  'board',
  'accessory',
  'navigation',
  'homePage',
  'contactPage',
  'faqPage',
  'whereToBuyPage',
  'ourStoryPage',
  'tkIdPage',
]

// Singletons: exactly one document, edited from a fixed structure pane.
export const SINGLETON_TYPES = ['seoSettings', 'contactSettings', 'footerSettings', 'authPage', 'boardsPageSettings', 'accessoriesPageSettings', 'accountPageSettings']

// Bespoke i18n singletons that live under Pages → <language>, in display order.
const BESPOKE_PAGES: ReadonlyArray<readonly [type: string, title: string]> = [
  ['homePage', 'Home'],
  ['ourStoryPage', 'Our Story'],
  ['contactPage', 'Contact'],
  ['faqPage', 'FAQ'],
  ['whereToBuyPage', 'Where to buy'],
  ['tkIdPage', 'TK ID'],
]

// One bespoke i18n singleton opened directly as its fixed per-locale document.
// `initialValueTemplate(`${type}-${lang}`)` is the document-internationalization
// plugin's static template, which stamps the required (hidden) `language` field —
// so a doc created from this pane (deleted doc / fresh dataset) is never left with
// `language: null`, which would make it invisible to every `language == $locale` query.
const langSingletonItem = (
  S: StructureBuilder,
  lang: (typeof SUPPORTED_LANGUAGES)[number],
  type: string,
  title: string
) =>
  S.listItem()
    .title(title)
    .id(`${type}-${lang.id}`)
    .child(
      S.document()
        .schemaType(type)
        .documentId(`tk-${type}-${lang.id}`)
        .title(`${title} — ${lang.title}`)
        .initialValueTemplate(`${type}-${lang.id}`)
    )

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
                      .apiVersion(API_VERSION)
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
                      .apiVersion(API_VERSION)
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
          S.list()
            .title('Menus')
            .items(
              SUPPORTED_LANGUAGES.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .id(`menus-${lang.id}`)
                  .icon(TranslateIcon)
                  .child(
                    S.documentTypeList('navigation')
                      .apiVersion(API_VERSION)
                      .title(`Menus — ${lang.title}`)
                      .filter('_type == "navigation" && language == $lang')
                      .params({ lang: lang.id })
                  )
              )
            )
        ),
      S.divider(),
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Pages')
            .items(
              SUPPORTED_LANGUAGES.map((lang) =>
                S.listItem()
                  .title(lang.title)
                  .id(`pages-${lang.id}`)
                  .icon(TranslateIcon)
                  .child(
                    S.list()
                      .title(`Pages — ${lang.title}`)
                      .items([
                        // Bespoke i18n singletons — one fixed doc per locale.
                        ...BESPOKE_PAGES.map(([type, title]) =>
                          langSingletonItem(S, lang, type, title)
                        ),
                        S.divider(),
                        // Generic pages — many docs of type `page`.
                        S.listItem()
                          .title('Other pages')
                          .id(`page-${lang.id}`)
                          .child(
                            S.documentTypeList('page')
                              .apiVersion(API_VERSION)
                              .title(`Pages — ${lang.title}`)
                              .filter('_type == "page" && language == $lang')
                              .params({ lang: lang.id })
                          ),
                      ])
                  )
              )
            )
        ),
      S.divider(),
      S.listItem()
        .title('Settings')
        .icon(CogIcon)
        .child(
          S.list()
            .title('Settings')
            .items([
              S.listItem()
                .title('SEO')
                .icon(CogIcon)
                .child(S.document().schemaType('seoSettings').documentId('seoSettings').title('SEO')),
              S.listItem()
                .title('Contact')
                .icon(CogIcon)
                .child(S.document().schemaType('contactSettings').documentId('contactSettings').title('Contact')),
              S.listItem()
                .title('Footer')
                .icon(CogIcon)
                .child(S.document().schemaType('footerSettings').documentId('footerSettings').title('Footer')),
              S.listItem()
                .title('Login')
                .icon(CogIcon)
                .child(S.document().schemaType('authPage').documentId('authPage').title('Login')),
            ])
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
    presentationTool({
      previewUrl: {
        previewMode: { enable: '/api/draft-mode/enable' },
      },
      resolve: {
        // Map each document to its front-end URL(s). i18n docs build /{language}/…
        locations: {
          homePage: defineLocations({
            select: { language: 'language' },
            resolve: (doc) => ({ locations: [{ title: 'Home', href: `/${doc?.language ?? 'en'}` }] }),
          }),
          board: defineLocations({
            select: { name: 'name', slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: doc?.name ?? 'Board', href: `/${doc?.language ?? 'en'}/boards/${doc.slug}` }] }
                : { locations: [] },
          }),
          accessory: defineLocations({
            select: { name: 'name', slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: doc?.name ?? 'Accessory', href: `/${doc?.language ?? 'en'}/accessories/${doc.slug}` }] }
                : { locations: [] },
          }),
          page: defineLocations({
            select: { title: 'title', slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: doc?.title ?? 'Page', href: `/${doc?.language ?? 'en'}/${doc.slug}` }] }
                : { locations: [] },
          }),
          ourStoryPage: defineLocations({
            select: { slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: 'Our Story', href: `/${doc?.language ?? 'en'}/${doc.slug}` }] }
                : { locations: [] },
          }),
          whereToBuyPage: defineLocations({
            select: { slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: 'Where to buy', href: `/${doc?.language ?? 'en'}/${doc.slug}` }] }
                : { locations: [] },
          }),
          contactPage: defineLocations({
            select: { slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: 'Contact', href: `/${doc?.language ?? 'en'}/${doc.slug}` }] }
                : { locations: [] },
          }),
          faqPage: defineLocations({
            select: { slug: 'slug.current', language: 'language' },
            resolve: (doc) =>
              doc?.slug
                ? { locations: [{ title: 'FAQ', href: `/${doc?.language ?? 'en'}/${doc.slug}` }] }
                : { locations: [] },
          }),
          tkIdPage: defineLocations({
            select: { language: 'language' },
            resolve: (doc) => ({ locations: [{ title: 'TK ID', href: `/${doc?.language ?? 'en'}/tk-id` }] }),
          }),
        },
      },
    }),
    media(),
    linkField({
      linkableSchemaTypes: [
        'page',
        'homePage',
        'ourStoryPage',
        'contactPage',
        'tkIdPage',
        'faqPage',
        'whereToBuyPage',
        'boardsPageSettings',
        'accessoriesPageSettings',
        'accountPageSettings',
      ],
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
  // Hide the built-in Releases + Scheduled-drafts tools from the Studio.
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },
  schema: {
    types: schemaTypes,
  },
  document: {
    // Translated types must be created with a language. The i18n plugin adds
    // per-language templates ("accessory-en", "board-fr", …) that set it; the
    // bare template ("accessory", "board", "page") would create a doc with no
    // language. Remove the bare ones everywhere (global "+" AND pane "+").
    // Singletons are never created from "+" either — they live in a fixed pane.
    newDocumentOptions: (prev) =>
      prev.filter(
        (item) =>
          !TRANSLATABLE_TYPES.includes(item.templateId) &&
          !SINGLETON_TYPES.includes(item.templateId)
      ),
    // Singletons can't be duplicated or deleted — only edited/published.
    actions: (prev, { schemaType }) =>
      SINGLETON_TYPES.includes(schemaType)
        ? prev.filter((action) => !['duplicate', 'delete', 'unpublish'].includes(action.action ?? ''))
        : prev,
  },
})
