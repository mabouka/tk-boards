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
    <blockquote className={classList}
      data-halo
      data-halo-rgb="225, 225, 255"
      data-halo-opacity="0.23"
      data-halo-w="43vw"
      data-halo-h="32vh"
      data-halo-spread="1%">
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
