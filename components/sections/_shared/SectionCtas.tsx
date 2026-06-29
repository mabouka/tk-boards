import type { Cta } from '@/sanity/lib/types'
import styles from './SectionCtas.module.css'

type Props = {
  ctas?: Cta[]
  theme?: 'light' | 'dark'
}

/**
 * Shared CTA row for text sections (Text + Image, Text + YouTube): the first CTA
 * is the primary (filled), the rest are outlined; colours follow the theme.
 */
export default function SectionCtas({ ctas, theme = 'light' }: Props) {
  if (!ctas || ctas.length === 0) return null
  const fill = theme === 'dark' ? 'u-cta--white-fill' : 'u-cta--black-fill'
  const outline = theme === 'dark' ? 'u-cta--white-outline' : 'u-cta--black-outline'

  return (
    <div className={styles.ctas}>
      {ctas.map((cta, i) =>
        cta.href && cta.text ? (
          <a
            key={cta._key ?? i}
            href={cta.href}
            className={`u-cta ${i === 0 ? fill : outline}`}
            {...(cta.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {cta.text}
          </a>
        ) : null
      )}
    </div>
  )
}
