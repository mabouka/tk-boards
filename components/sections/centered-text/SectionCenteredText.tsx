import { PortableText } from 'next-sanity'
import type { PortableTextValue } from '@/sanity/lib/types'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './SectionCenteredText.module.css'

type Props = {
  title?: string
  body?: PortableTextValue
}

/** Centered text block, max-width 850px, with an optional title. */
export default function SectionCenteredText({ title, body }: Props) {
  return (
    <section
      className={styles.section}
      {...haloProps({ rgb: '225, 255, 255', opacity: 0.23, w: '42vw', h: '39vh', spread: '1%' })}
    >
      <div className={styles.inner}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {body && (
          <div className={styles.body}>
            <PortableText value={body} />
          </div>
        )}
      </div>
    </section>
  )
}
