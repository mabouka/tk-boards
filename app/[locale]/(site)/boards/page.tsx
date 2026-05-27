import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { boardsQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import styles from './boards.module.css'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function BoardsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('boards')

  const boards = await client.fetch(boardsQuery, { locale })

  return (
    <div className={styles.boards}>
      <div className={styles.boards__header}>
        <h1 className={styles.boards__title}>{t('title')}</h1>
      </div>

      <ul className={styles.boards__grid}>
        {boards.map((board: BoardListItem) => (
          <li key={board._id} className={styles.board_card}>
            <Link href={`/boards/${board.slug.current}`} className={styles.board_card__link}>
              {board.mainImage && (
                <div className={styles.board_card__image}>
                  <Image
                    src={urlFor(board.mainImage).width(800).height(600).url()}
                    alt={board.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
              )}
              <div className={styles.board_card__body}>
                {board.series?.name && (
                  <span className={styles.board_card__series}>{board.series.name}</span>
                )}
                <h2 className={styles.board_card__name}>{board.name}</h2>
                {board.tagline && (
                  <p className={styles.board_card__tagline}>{board.tagline}</p>
                )}
                {board.weight && (
                  <p className={styles.board_card__weight}>
                    <span className={styles.board_card__weight_label}>{t('weight')}</span>
                    {' '}{board.weight} kg
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

type SanityImage = { _type: string; asset: { _ref: string } }

type BoardListItem = {
  _id: string
  name: string
  slug: { current: string }
  series?: { name: string; slug: { current: string } }
  style?: string
  tagline?: string
  weight?: number
  mainImage?: SanityImage
}
