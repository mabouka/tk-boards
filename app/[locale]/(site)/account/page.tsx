import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { getUserBoards } from '@/lib/tk-id'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { urlFor } from '@/sanity/lib/image'
import { boardImageBySkuQuery } from '@/sanity/lib/queries'
import BoardCard from './BoardCard'
import styles from './account.module.css'

type Props = { params: Promise<{ locale: string }> }

export default async function MyBoardsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('account')
  const session = await auth()
  const userId = session?.user?.id ?? ''

  const boards = await getUserBoards(userId, locale)

  // Board photos (Sanity, by parent SKU) — one fetch per distinct SKU, cached.
  const skus = [...new Set(boards.map((b) => b.sku).filter((s): s is string => Boolean(s)))]
  const photoBySku = new Map<string, string>()
  await Promise.all(
    skus.map(async (sku) => {
      const board = await client.fetch(boardImageBySkuQuery, { sku, locale }, sanityCache('board'))
      if (board?.mainImage) {
        photoBySku.set(sku, urlFor(board.mainImage).width(700).quality(85).auto('format').url())
      }
    })
  )

  return (
    <>
      <div className={styles.toolbar}>
        <Link href={`/${locale}/tk-id`} className="u-cta u-cta--white-fill">
          {t('register_board')}
        </Link>
      </div>

      {boards.length === 0 ? (
        <div className={styles.empty}>
          <p>{t('boards_empty')}</p>
          <Link href={`/${locale}/tk-id`} className="u-cta u-cta--white-outline">
            {t('register_board')}
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {boards.map((board) => (
            <BoardCard
              key={board.token}
              board={board}
              photoUrl={board.sku ? (photoBySku.get(board.sku) ?? null) : null}
              locale={locale}
            />
          ))}
        </div>
      )}
    </>
  )
}
