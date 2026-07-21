'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import styles from './account.module.css'

export default function AccountTabs({ locale }: { locale: string }) {
  const t = useTranslations('account')
  const pathname = usePathname()

  const tabs = [
    { key: 'boards', label: t('tab_boards'), href: `/${locale}/account` },
    { key: 'orders', label: t('tab_orders'), href: `/${locale}/account/orders` },
    { key: 'informations', label: t('tab_informations'), href: `/${locale}/account/informations` },
  ]

  return (
    <nav className={styles.tabs}>
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
