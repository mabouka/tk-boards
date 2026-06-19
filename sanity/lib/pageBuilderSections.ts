/**
 * Single source of truth for the page-builder section library.
 *
 * Every document that exposes a `sections` page builder (board, homePage, page,
 * contactPage, tkIdPage) spreads this list into its `of:` array. Add a new
 * section here once and it becomes available everywhere.
 *
 * Keep in sync with the renderer switch in `components/page-builder/PageBuilder.tsx`
 * and the flat `sections[]{…}` GROQ projection in `sanity/lib/queries.ts`.
 */
export const pageBuilderSections = [
  { type: 'sectionAboutPreview' },
  { type: 'sectionBoards' },
  { type: 'sectionMarquee' },
  { type: 'sectionTextImage' },
  { type: 'sectionTextGallery' },
  { type: 'sectionFullMedia' },
  { type: 'sectionBigQuote' },
  { type: 'sectionMediaLine' },
  { type: 'sectionFeatures' },
  { type: 'sectionOutline' },
  { type: 'sectionFixedImage' },
  { type: 'sectionSpecs' },
  { type: 'sectionWorkshop' },
  { type: 'sectionCenteredText' },
] as const
