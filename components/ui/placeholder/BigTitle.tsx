import styles from './BigTitle.module.css'

// Temporary full-screen big title (no real template yet).
export default function BigTitle({ children }: { children: React.ReactNode }) {
  return (
    <section className={styles.placeholder}>
      <h1 className={styles.title}>{children}</h1>
    </section>
  )
}
