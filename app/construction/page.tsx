import type { Metadata } from 'next'
import LogoTK from '@/components/icons/LogoTK'
import styles from './construction.module.css'

export const metadata: Metadata = {
  title: 'TK Boards — Coming soon',
  robots: { index: false, follow: false },
}

export default function ConstructionPage() {
  return (
    <main className={styles.screen}>
      <LogoTK className={styles.logo} aria-label="TK Boards" />
    </main>
  )
}
