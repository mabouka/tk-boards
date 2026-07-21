import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import LostReportModal from '@/app/[locale]/tk-id/[token]/LostReportModal'
import { markRecovered } from '@/app/[locale]/tk-id/[token]/actions'
import TransferModal from './TransferModal'
import { haloProps } from '@/components/ui/halo/haloProps'
import type { UserBoard } from '@/lib/tk-id'
import styles from './account.module.css'

type Props = {
  board: UserBoard
  photoUrl: string | null
  locale: string
}

export default async function BoardCard({ board, photoUrl, locale }: Props) {
  const t = await getTranslations('account')
  const tk = await getTranslations('tkid')
  const stolen = board.status === 'stolen'

  return (
    <article
      className={styles.card}
      {...haloProps({ rgb: '225, 225, 255', opacity: 0.16, w: '39vw', h: '55vh', spread: '1%' })}
    >
      <div className={styles.cardPhoto}>
        {photoUrl && (
          <Image
            src={photoUrl}
            alt={board.name ?? ''}
            fill
            sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, 30vw"
          />
        )}
        {stolen && (
          <span className={styles.stamp} aria-hidden="true">
            {tk('stolen_stamp')}
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        {board.name && <h2 className={styles.cardName}>{board.name}</h2>}

        <dl className={styles.cardMeta}>
          {board.serial && (
            <div className={styles.cardRow}>
              <dt className={styles.cardKey}>{tk('serial_label')}</dt>
              <dd className={`${styles.cardVal} ${styles.mono}`}>{board.serial}</dd>
            </div>
          )}
          {board.attributes.map((a, i) => (
            <div key={i} className={styles.cardRow}>
              <dt className={styles.cardKey}>{a.name}</dt>
              <dd className={styles.cardVal}>
                {a.swatchHex && (
                  <span className={styles.swatch} style={{ background: a.swatchHex }} aria-hidden="true" />
                )}
                {a.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className={styles.cardActions}>
          <Link href={`/${locale}/tk-id/${board.token}`} className="u-cta u-cta--white-outline">
            {t('view_board')}
          </Link>

          <TransferModal locale={locale} token={board.token} />

          {stolen ? (
            <form action={markRecovered}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="token" value={board.token} />
              <input type="hidden" name="next" value={`/${locale}/account`} />
              <button type="submit" className="u-cta u-cta--red-outline">
                {tk('mark_recovered')}
              </button>
            </form>
          ) : (
            <LostReportModal locale={locale} token={board.token} />
          )}
        </div>
      </div>
    </article>
  )
}
