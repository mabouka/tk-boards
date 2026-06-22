import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './SectionBigQuote.module.css'

type Props = {
  quote: string
  authorName?: string
  authorRole?: string
  theme?: 'light' | 'dark'
}

export default function SectionBigQuote({
  quote,
  authorName,
  authorRole,
  theme = 'dark',
}: Props) {
  const classList = [styles.bigQuote, theme === 'light' ? styles['bigQuote--light'] : '']
    .filter(Boolean)
    .join(' ')

  return (
    <blockquote
      className={classList}
      {...haloProps({ rgb: '225, 225, 255', opacity: 0.23, w: '43vw', h: '32vh', spread: '1%' })}
    >
      <p className={styles.bigQuote__text}>{quote}</p>

      {(authorName || authorRole) && (
        <>
          <span className={styles.bigQuote__rule} aria-hidden="true" />
          <cite className={styles.bigQuote__author}>
            {authorName && <span className={styles.bigQuote__name}>{authorName}</span>}
            {authorRole && <span className={styles.bigQuote__role}>{authorRole}</span>}
          </cite>
        </>
      )}
    </blockquote>
  )
}
