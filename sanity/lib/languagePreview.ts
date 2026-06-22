import type { PreviewConfig } from 'sanity'

/**
 * document-internationalization creates one document per language, all sharing
 * the same title. Without help, the link picker and document lists show several
 * identical rows (e.g. three "TK ID"). Wrap a preview with this so the document
 * language (FR/EN/ES) is prepended to the subtitle and the rows become distinct.
 *
 *   preview: withLanguage({ select: { title: 'title', media: 'heroImage' } })
 */
export function withLanguage(preview: {
  select: Record<string, string>
  prepare?: (selection: Record<string, unknown>) => {
    title?: string
    subtitle?: string
    media?: unknown
  }
}): PreviewConfig {
  const select = { ...preview.select, language: 'language' }
  const basePrepare = preview.prepare
  return {
    select,
    prepare(selection: Record<string, unknown>) {
      const base = basePrepare
        ? basePrepare(selection)
        : {
            title: selection.title as string | undefined,
            subtitle: selection.subtitle as string | undefined,
            media: selection.media,
          }
      const lang =
        typeof selection.language === 'string' ? selection.language.toUpperCase() : undefined
      const subtitle = [lang, base.subtitle].filter(Boolean).join(' · ')
      return {
        ...base,
        subtitle: subtitle || undefined,
        media: base.media ?? selection.media,
      }
    },
  } as PreviewConfig
}
