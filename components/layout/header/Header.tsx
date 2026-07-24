'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { useLocalePaths } from '@/components/i18n/LocalePaths'
import LogoTK from '@/components/ui/icons/LogoTK'
import IconMenu from '@/components/ui/icons/IconMenu'
import IconCart from '@/components/ui/icons/IconCart'
import IconAccount from '@/components/ui/icons/IconAccount'
import { useMenu } from '@/components/layout/menu/MenuContext'
import { useCart } from '@/lib/use-cart'
import { useEshop } from '@/components/commerce/eshop-context'
import styles from './Header.module.css'

const COMPACT_HEIGHT = 60 // hauteur du header compact en mode fixed

const LOCALES = ['fr', 'en', 'es'] as const

export default function Header({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const { open, setOpen } = useMenu()
  const cart = useCart()
  const { visible: shopVisible } = useEshop()
  const pathname = usePathname()
  // Per-locale paths published by the current page (CMS pages / products whose
  // slug differs per locale). Falls back to the current pathname for static and
  // same-slug pages.
  const localePaths = useLocalePaths()
  const headerRef = useRef<HTMLElement>(null)
  const prevY = useRef(0)
  const offsetY = useRef(0)
  const isFixedRef = useRef(false)
  const pendingExitRef = useRef(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    prevY.current = window.scrollY
    const vh = window.innerHeight * 0.6

    // Toggle la classe `fixed` directement sur le nœud DOM — pas de re-render
    const setFixed = (on: boolean) => {
      isFixedRef.current = on
      headerRef.current?.classList.toggle(styles['header--fixed'], on)
    }

    // Page chargée déjà au-delà de 100vh → fixed + caché d'emblée
    if (window.scrollY >= vh) {
      setFixed(true)
      offsetY.current = -COMPACT_HEIGHT
      if (headerRef.current) headerRef.current.style.transform = `translateY(${-COMPACT_HEIGHT}px)`
    }

    const onScroll = () => {
      const y = window.scrollY
      const delta = y - prevY.current
      prevY.current = y

      // ── Zone absolue (< 100vh) ───────────────────────────────────
      if (y < vh) {
        if (isFixedRef.current && !pendingExitRef.current) {
          // Animer la sortie avant de repasser en absolute
          pendingExitRef.current = true
          if (headerRef.current) {
            headerRef.current.style.transition = 'transform 0.35s ease'
            headerRef.current.style.transform = `translateY(${-COMPACT_HEIGHT}px)`
          }
          offsetY.current = -COMPACT_HEIGHT

          exitTimerRef.current = setTimeout(() => {
            pendingExitRef.current = false
            exitTimerRef.current = null
            setFixed(false)
            if (headerRef.current) {
              headerRef.current.style.transition = ''
              headerRef.current.style.transform = ''
            }
            offsetY.current = 0
          }, 350)
        }
        return
      }

      // ── Annuler la sortie si on repasse au-delà de vh ────────────
      if (pendingExitRef.current) {
        pendingExitRef.current = false
        if (exitTimerRef.current) { clearTimeout(exitTimerRef.current); exitTimerRef.current = null }
        if (headerRef.current) headerRef.current.style.transition = ''
        // isFixedRef reste true → on continue vers le scrubbing
      }

      // ── Passage absolute → fixed : instantané, caché, noir ──────
      if (!isFixedRef.current) {
        setFixed(true)
        offsetY.current = -COMPACT_HEIGHT
        if (headerRef.current) {
          headerRef.current.style.transition = ''
          headerRef.current.style.transform = `translateY(${-COMPACT_HEIGHT}px)`
        }
        return
      }

      // ── Scrubbing 1:1 ────────────────────────────────────────────
      offsetY.current = Math.min(0, Math.max(-COMPACT_HEIGHT, offsetY.current - delta))
      if (headerRef.current) headerRef.current.style.transform = `translateY(${offsetY.current}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  }, [])

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.header__inner}>

        <button
          className={styles.header__menu}
          type="button"
          aria-label={t('menu')}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <IconMenu />
          <span className={styles.header__menu_label}>{t('menu')}</span>
        </button>

        <Link href="/" className={styles.header__logo} aria-label="TK Boards">
          <LogoTK />
        </Link>

        <div className={styles.header__actions}>
          <div className={styles.header__lang}>
            <div className={styles.header__lang_others}>
              {LOCALES.filter((l) => l !== locale).map((l) => (
                <Link
                  key={l}
                  // A page that publishes localePaths (slug differs per locale): use
                  // the translated path, or home if that locale has no translation —
                  // never the current-locale slug under another locale (404). Static
                  // same-slug pages don't publish paths → the current pathname is right.
                  href={localePaths ? (localePaths[l] ?? '/') : pathname}
                  locale={l}
                  className={styles.header__lang_option}
                >
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>
            <span className={styles.header__lang_current}>{locale.toUpperCase()}</span>
          </div>

          {shopVisible && (
            <button type="button" className={styles.header__cart} onClick={() => cart.setOpen(true)}>
              <IconCart />
              <span>{t('cart')}</span>
              {cart.count > 0 && <span className={styles.header__cart_count}>{cart.count}</span>}
            </button>
          )}

          <Link href="/account" className={styles.header__account}>
            <IconAccount />
            <span>{t('account')}</span>
          </Link>
        </div>

      </div>
    </header>
  )
}
