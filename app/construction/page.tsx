import type { Metadata } from 'next'
import LogoTK from '@/components/ui/icons/LogoTK'
import styles from './construction.module.css'

export const metadata: Metadata = {
  title: 'TK Boards — Coming soon',
  robots: { index: false, follow: false },
}


export default function ConstructionPage() {
  return (
    <main className={styles.screen}>
      <LogoTK className={styles.logo} aria-label="TK Boards" />
      <h1 className={styles.title}>Coming soon</h1>
    </main>
  )
}
