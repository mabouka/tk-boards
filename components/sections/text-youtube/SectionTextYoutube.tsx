import { PortableText } from 'next-sanity'
import type { PortableTextValue, Cta } from '@/sanity/lib/types'
import { haloProps } from '@/components/ui/halo/haloProps'
import YoutubePlayer from './YoutubePlayer'
import styles from './SectionTextYoutube.module.css'

/** Extract the 11-char video id from any common YouTube URL form. */
function youtubeId(url?: string): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/
  )
  return m ? m[1] : null
}

type Props = {
  label?: string
  title: string
  body?: PortableTextValue
  youtubeUrl?: string
  /** Optional poster URL (resolved from a Sanity image); falls back to the YouTube thumbnail. */
  posterUrl?: string
  ctas?: Cta[]
  theme?: 'light' | 'dark'
  videoPosition?: 'left' | 'right'
}

export default function SectionTextYoutube({
  label,
  title,
  body,
  youtubeUrl,
  posterUrl,
  ctas,
  theme = 'light',
  videoPosition = 'left',
}: Props) {
  const id = youtubeId(youtubeUrl)
  const isDark = theme === 'dark'

  const classList = [
    styles.textYoutube,
    isDark ? styles['textYoutube--dark'] : '',
    videoPosition === 'right' ? styles['textYoutube--reverse'] : '',
  ]
    .filter(Boolean)
    .join(' ')

  // First CTA is the primary (filled), the rest are outlined.
  const ctaFill = isDark ? 'u-cta--white-fill' : 'u-cta--black-fill'
  const ctaOutline = isDark ? 'u-cta--white-outline' : 'u-cta--black-outline'

  return (
    <section
      className={classList}

    >
      <div className={styles.textYoutube__video}       {...(isDark
        ? haloProps({ rgb: '225, 255, 255', opacity: 0.19, w: '65vw', h: '74vh', spread: '29%' })
        : {})}>
        {id && (
          <YoutubePlayer
            id={id}
            title={title}
            poster={posterUrl ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
          />
        )}
      </div>

      <div className={styles.textYoutube__content}>
        {label && <span className={styles.textYoutube__eyebrow}>{label}</span>}
        <h2 className={styles.textYoutube__title}>{title}</h2>
        {body && (
          <div className={styles.textYoutube__body}>
            <PortableText value={body} />
          </div>
        )}
        {ctas && ctas.length > 0 && (
          <div className={styles.textYoutube__ctas}>
            {ctas.map((cta, i) =>
              cta.href && cta.text ? (
                <a
                  key={cta._key ?? i}
                  href={cta.href}
                  className={`u-cta ${i === 0 ? ctaFill : ctaOutline}`}
                  {...(cta.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {cta.text}
                </a>
              ) : null
            )}
          </div>
        )}
      </div>
    </section>
  )
}
