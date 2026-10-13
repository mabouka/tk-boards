import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { boardsQuery, seriesQuery, boardsPageSettingsQuery } from '@/sanity/lib/queries'
import type { BoardsQueryResult } from '@/sanity.types'
import { urlFor, hasAsset } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import BoardsGridClient from '@/components/sections/boards-grid/BoardsGridClient'
import PageBuilder from '@/components/sections/page-builder/PageBuilder'

type Props = {
  params: Promise<{ locale: string }>
}

// Square card image — crops to 1:1 around the editor crop + hotspot (via urlFor).
const squareImage = (mainImage: BoardsQueryResult[number]['mainImage']) =>
  hasAsset(mainImage) ? urlFor(mainImage).width(800).height(800).quality(85).url() : null

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
  const [t, settings, seriesList, allBoards] = await Promise.all([
    getTranslations('boards'),
    client.fetch(boardsPageSettingsQuery, { locale }, sanityCache('boardsPageSettings')),
    client.fetch(seriesQuery, { locale }, sanityCache('series', 'board')),
    client.fetch(boardsQuery, { locale }, sanityCache('board')),
  ])

  // Filters: "Tout" + each series (Carbon Series / Wood Series…), in series order.
  const series = seriesList.map((s) => ({ id: s._id, name: s.name, slug: s.slug?.current ?? null }))

  // All boards as square cards; a board with no series shows only under "Tout".
  const boards = allBoards.map((b) => ({
    _id: b._id,
    name: b.name,
    slug: b.slug?.current ?? '',
    imageUrl: squareImage(b.mainImage),
    seriesName: b.series?.name ?? null,
    seriesSlug: b.series?.slug?.current ?? null,
  }))

  return (
    <>
      <BoardsGridClient
        title={settings?.title || t('title')}
        allLabel={t('all')}
        series={series}
        boards={boards}
      />

      {/* Editor-managed sections, rendered after the board listing. */}
      {settings?.sections && settings.sections.length > 0 && (
        <PageBuilder sections={settings.sections} locale={locale} />
      )}
    </>
  )
}
