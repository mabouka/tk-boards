import styles from './SectionMarquee.module.css'

type MarqueeItem = {
  _key: string
  text: string
  accent?: boolean
}

type Props = {
  items: MarqueeItem[]
}

function Track({ items }: { items: MarqueeItem[] }) {
  return (
    <>
      {items.map((item) => (
        <span key={item._key} className={styles.marquee__group}>
          <span className={item.accent ? styles['marquee__item--accent'] : styles.marquee__item}>
            {item.text}
          </span>
          <span className={styles.marquee__sep} aria-hidden="true">·</span>
        </span>
      ))}
    </>
  )
}

export default function SectionMarquee({ items }: Props) {
  if (!items?.length) return null

  return (
    <div className={styles.marquee} aria-label="marquee">
      <div className={styles.marquee__track}>
        <Track items={items} />
        {/* Duplicated for seamless loop */}
        <Track items={items} />
      </div>
    </div>
  )
}
