import type { Metadata } from 'next'
import { Fragment } from 'react'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { boardsQuery, seriesQuery, boardsPageSettingsQuery } from '@/sanity/lib/queries'
import type { BoardsQueryResult } from '@/sanity.types'
import { urlFor } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import BoardCard from '@/components/sections/boards-preview/BoardCard'
import SectionMarquee from '@/components/sections/marquee/SectionMarquee'
import PageBuilder from '@/components/sections/page-builder/PageBuilder'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './boards.module.css'

// Per-card glow — only on the /boards page (not the home preview).
const cardHalo = haloProps({ rgb: '225, 225, 255', opacity: 0.27, w: '29vw', h: '59vh', spread: '1%' })
// Glow behind the page title.
const titleHalo = haloProps({ rgb: '225, 225, 255', opacity: 0.24, w: '67vw', h: '64vh', spread: '1%' })

type Props = {
  params: Promise<{ locale: string }>
}

const cardImage = (mainImage: BoardsQueryResult[number]['mainImage']) =>
  mainImage ? urlFor(mainImage).width(780).height(1010).quality(85).url() : null

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [t, settings, boardsPage] = await Promise.all([
    getTranslations({ locale, namespace: 'boards' }),
    getSiteSettings(locale),
    client.fetch(boardsPageSettingsQuery, { locale }, sanityCache('boardsPageSettings')),
  ])

  return buildMetadata({
    locale,
    path: '/boards',
    title: boardsPage?.seoTitle || boardsPage?.title || t('title'),
    absoluteTitle: Boolean(boardsPage?.seoTitle),
    description: boardsPage?.seoDescription || settings?.seoDescription || undefined,
    image: boardsPage?.ogImage ?? undefined,
    imageAlt: boardsPage?.ogImage?.alt ?? boardsPage?.title ?? t('title'),
    alternateLanguages: true,
  })
}

export default async function BoardsPage({ params }: Props) {
  const { locale } = await params
  const [t, settings] = await Promise.all([
    getTranslations('boards'),
    client.fetch(boardsPageSettingsQuery, { locale }, sanityCache('boardsPageSettings')),
  ])

  // Default to grouped-by-series unless the editor explicitly turned it off.
  const grouped = settings?.groupBySeries !== false
  const viewBoard = t('view_board')

  // Marquee shown between the series (grouped mode only).
  const marqueeItems = (settings?.marquee ?? []).map((m) => ({
    _key: m._key,
    text: m.text ?? undefined,
    accent: m.accent ?? undefined,
  }))

  const [seriesList, flatBoards] = await Promise.all([
    grouped ? client.fetch(seriesQuery, { locale }, sanityCache('series', 'board')) : Promise.resolve([]),
    grouped ? Promise.resolve([]) : client.fetch(boardsQuery, { locale }, sanityCache('board')),
  ])

  return (
    <div className={styles.boards}>
      <header className={styles.boards__header}>
        <h1 className={styles.boards__title} {...titleHalo}>{settings?.title || t('title')}</h1>
      </header>

      {grouped ? (
        seriesList.map((s, i) => (
          <Fragment key={s._id}>
            <section className={styles.series}>
              <h2 className={styles.series__title}>{s.title || s.name}</h2>
              <span className={styles.series__divider} aria-hidden="true" />
              {s.description && <p className={styles.series__desc}>{s.description}</p>}
              <ul className={styles.grid}>
                {s.boards.map((b) => (
                  <li key={b._id}>
                    <BoardCard
                      href={`/boards/${b.slug?.current ?? ''}`}
                      name={b.name}
                      imageUrl={cardImage(b.mainImage)}
                      seriesName={s.name}
                      tagVariant={s.tagVariant}
                      style={b.style}
                      viewBoardLabel={viewBoard}
                      halo={cardHalo}
                    />
                  </li>
                ))}
              </ul>
            </section>
            {/* Marquee between the first and second series — only when there are ≥2. */}
            {i === 0 && seriesList.length > 1 && marqueeItems.length > 0 && (
              <SectionMarquee items={marqueeItems} />
            )}
          </Fragment>
        ))
      ) : (
        <ul className={styles.grid}>
          {flatBoards.map((b) => (
            <li key={b._id}>
              <BoardCard
                href={`/boards/${b.slug?.current ?? ''}`}
                name={b.name}
                imageUrl={cardImage(b.mainImage)}
                seriesName={b.series?.name ?? null}
                tagVariant={b.series?.tagVariant ?? null}
                style={b.style}
                viewBoardLabel={viewBoard}
                halo={cardHalo}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Editor-managed sections, rendered after the board listing. */}
      {settings?.sections && settings.sections.length > 0 && (
        <PageBuilder sections={settings.sections} locale={locale} />
      )}
    </div>
  )
}
