import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import LogoTK from '@/components/icons/LogoTK'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { authPageQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import styles from './auth.module.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params
  const [t, authContent] = await Promise.all([
    getTranslations('auth'),
    client.fetch(authPageQuery, { locale }, sanityCache('authPage')),
  ])

  const bgUrl = authContent?.backgroundImage
    ? urlFor(authContent.backgroundImage).width(1600).quality(80).url()
    : null

  return (
    <div className={styles.split}>
      <div
        className={styles.photoBg}
        aria-hidden
        style={
          bgUrl
            ? {
                backgroundImage: `linear-gradient(to bottom, rgba(13, 15, 20, 0.35), rgba(13, 15, 20, 0.8)), url(${bgUrl})`,
              }
            : undefined
        }
      />
      <div className={styles.surface} aria-hidden />

      <aside className={styles.brand}>
        <Link href={`/${locale}`} className={styles.logo} aria-label="TK Boards">
          <LogoTK />
        </Link>
        <div className={styles.brandBottom}>
          <p className={styles.brandTagline}>{authContent?.tagline ?? t('brand_tagline')}</p>
          <p className={styles.brandText}>{authContent?.paragraph ?? t('brand_text')}</p>
          <Link href={`/${locale}`} className={styles.back}>
            {t('back_to_site')}
          </Link>
        </div>
      </aside>

      <div className={styles.formPanel}>{children}</div>
    </div>
  )
}
