import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import LogoTK from '@/components/icons/LogoTK'
import styles from './auth.module.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params
  const t = await getTranslations('auth')

  return (
    <div className={styles.split}>
      <div className={styles.photoBg} aria-hidden />
      <div className={styles.surface} aria-hidden />

      <aside className={styles.brand}>
        <Link href={`/${locale}`} className={styles.logo} aria-label="TK Boards">
          <LogoTK />
        </Link>
        <div className={styles.brandBottom}>
          <p className={styles.brandTagline}>{t('brand_tagline')}</p>
          <p className={styles.brandText}>{t('brand_text')}</p>
          <Link href={`/${locale}`} className={styles.back}>
            {t('back_to_site')}
          </Link>
        </div>
      </aside>

      <div className={styles.formPanel}>{children}</div>
    </div>
  )
}
