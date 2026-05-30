import type { Metadata } from 'next'
import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { boardBySlugQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import styles from './board.module.css'

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

const getBoard = cache((locale: string, slug: string) =>
  client.fetch(boardBySlugQuery, { locale, slug })
)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const board = await getBoard(locale, slug)

  if (!board) return {}

  const settings = await getSiteSettings()

  const translations: { lang: string | null; slug: string | null }[] = Array.isArray(board.translations)
    ? board.translations
    : []
  const languageAlternates = translations
    .filter((tr): tr is { lang: string; slug: string } => Boolean(tr.lang && tr.slug))
    .map((tr) => ({ lang: tr.lang, path: `/boards/${tr.slug}` }))

  return buildMetadata({
    locale,
    path: `/boards/${slug}`,
    title: board.seoTitle ?? board.name,
    absoluteTitle: Boolean(board.seoTitle),
    description: board.seoDescription ?? board.tagline ?? settings?.seoDescription ?? undefined,
    image: board.ogImage ?? board.mainImage ?? undefined,
    imageAlt: board.ogImage?.alt ?? board.mainImage?.alt ?? board.seoTitle ?? board.name,
    languageAlternates,
  })
}

export default async function BoardPage({ params }: Props) {
  const { locale, slug } = await params
  const t = await getTranslations('boards')

  const board = await getBoard(locale, slug)

  if (!board) notFound()

  return (
    <div className={styles.board}>
      <div className={styles.board__back}>
        <Link href="/boards" className={styles.board__back_link}>
          ← {t('back')}
        </Link>
      </div>

      <div className={styles.board__layout}>
        <div className={styles.board__media}>
          {board.mainImage && (
            <div className={styles.board__image}>
              <Image
                src={urlFor(board.mainImage).width(1200).height(900).url()}
                alt={board.name}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            </div>
          )}
        </div>

        <div className={styles.board__content}>
          {board.series?.name && (
            <span className={styles.board__series}>{board.series.name}</span>
          )}
          <h1 className={styles.board__name}>{board.name}</h1>
          {board.tagline && (
            <p className={styles.board__tagline}>{board.tagline}</p>
          )}

          {board.specs && board.specs.length > 0 && (
            <div className={styles.board__specs}>
              <h2 className={styles.board__specs_title}>{t('specs')}</h2>
              <dl className={styles.board__specs_list}>
                {board.specs.map((spec, i) => (
                  <div key={i} className={styles.board__spec}>
                    <dt className={styles.board__spec_label}>{spec.label}</dt>
                    <dd className={styles.board__spec_value}>{spec.value}</dd>
                  </div>
                ))}
                {board.weight && (
                  <div className={styles.board__spec}>
                    <dt className={styles.board__spec_label}>{t('weight')}</dt>
                    <dd className={styles.board__spec_value}>{board.weight} kg</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className={styles.board__cta}>
            <button className={styles.board__order_btn} type="button">
              {t('order')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
