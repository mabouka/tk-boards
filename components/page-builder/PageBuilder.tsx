import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { urlFor } from '@/sanity/lib/image'
import { seriesQuery } from '@/sanity/lib/queries'
import type { SanityImage, PortableTextValue, Cta } from '@/sanity/lib/types'
import SectionAboutPreview from '@/components/about-preview/SectionAboutPreview'
import BoardsPreviewClient from '@/components/boards-preview/BoardsPreviewClient'
import SectionMarquee from '@/components/marquee/SectionMarquee'
import SectionTextImage from '@/components/text-image/SectionTextImage'

type Section = {
  _type: string
  _key: string
  // sectionBoards
  title?: string
  showFilters?: boolean
  // sectionMarquee
  items?: { _key: string; text: string; accent?: boolean }[]
  // sectionAboutPreview
  eyebrow?: string
  cta?: Cta
  // sectionTextImage
  label?: string
  body?: PortableTextValue
  image?: SanityImage
  ctas?: Cta[]
  theme?: 'light' | 'dark'
  imagePosition?: 'left' | 'right'
  layout?: 'full' | 'contained'
}

// Raw shape returned by `seriesQuery`, before image URLs are resolved.
type RawBoard = {
  _id: string
  name: string
  slug: { current: string }
  style?: string
  mainImage?: SanityImage
}

type RawSeries = {
  _id: string
  name: string
  slug: { current: string }
  tagVariant?: 'dark' | 'amber' | 'cream' | 'red' | 'outline-light' | 'outline-muted'
  boards: RawBoard[]
}

type Props = {
  sections: Section[]
  locale: string
}

export default async function PageBuilder({ sections, locale }: Props) {
  if (!sections?.length) return null

  const t = await getTranslations('home')

  // Pre-fetch data only for section types that are actually present
  const needsBoards = sections.some((s) => s._type === 'sectionBoards')
  const rawSeries: RawSeries[] = needsBoards
    ? await client.fetch<RawSeries[]>(seriesQuery, { locale })
    : []

  // Pre-resolve image URLs server-side so @sanity/image-url never reaches the client bundle
  const series = rawSeries.map((s) => ({
    ...s,
    boards: s.boards.map((board) => ({
      _id: board._id,
      name: board.name,
      slug: board.slug,
      style: board.style,
      imageUrl: board.mainImage
        ? urlFor(board.mainImage).width(780).height(1218).quality(85).url()
        : undefined,
    })),
  }))

  return (
    <>
      {sections.map((section) => {
        switch (section._type) {
          case 'sectionBoards':
            return (
              <BoardsPreviewClient
                key={section._key}
                series={series}
                title={section.title ?? t('boards_title')}
                discoverCta={t('boards_discover')}
                viewBoardLabel={t('view_board')}
                showFilters={section.showFilters ?? true}
              />
            )
          case 'sectionAboutPreview':
            return (
              <SectionAboutPreview
                key={section._key}
                eyebrow={section.eyebrow}
                title={section.title}
                image={section.image}
                body={section.body}
                cta={section.cta}
              />
            )
          case 'sectionMarquee':
            return (
              <SectionMarquee
                key={section._key}
                items={section.items ?? []}
              />
            )
          case 'sectionTextImage':
            return (
              <SectionTextImage
                key={section._key}
                label={section.label}
                title={section.title ?? ''}
                body={section.body}
                image={section.image}
                ctas={section.ctas}
                theme={section.theme}
                imagePosition={section.imagePosition}
                layout={section.layout}
              />
            )
          default:
            return null
        }
      })}
    </>
  )
}
