import { haloProps } from '@/components/halo/haloProps'
import styles from './SectionSpecs.module.css'

export type SpecRow = {
  _key?: string
  cells: string[]
}

type Props = {
  eyebrow?: string
  title?: string
  columns: string[]
  rows: SpecRow[]
}

export default function SectionSpecs({ eyebrow, title, columns, rows }: Props) {
  if (!columns?.length || !rows?.length) return null

  return (
    <section
      className={styles.section}
      {...haloProps({ rgb: '225, 255, 255', opacity: 0.2, w: '250vw', h: '66vh', spread: '1%', anchor: 'top-left' })}
    >
      {(eyebrow || title) && (
        <header className={styles.head}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          {title && <h2 className={styles.title}>{title}</h2>}
        </header>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row._key ?? ri}>
                {columns.map((_, ci) => (
                  <td key={ci}>{row.cells?.[ci] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
