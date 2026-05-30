'use client'

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LogoTK from '@/components/icons/LogoTK'
import IconMenu from '@/components/icons/IconMenu'
import IconCart from '@/components/icons/IconCart'
import IconAccount from '@/components/icons/IconAccount'
import styles from './Header.module.css'

const COMPACT_HEIGHT = 80 // hauteur du header compact en mode fixed

const LOCALES = ['fr', 'en', 'es'] as const

export default function Header({ locale }: { locale: string }) {
  const t = useTranslations('nav')
  const headerRef      = useRef<HTMLElement>(null)
  const prevY          = useRef(0)
  const offsetY        = useRef(0)
  const isFixedRef     = useRef(false)
  const pendingExitRef = useRef(false)
  const exitTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      const y     = window.scrollY
      const delta = y - prevY.current
      prevY.current = y

      // ── Zone absolue (< 100vh) ───────────────────────────────────
      if (y < vh) {
        if (isFixedRef.current && !pendingExitRef.current) {
          // Animer la sortie avant de repasser en absolute
          pendingExitRef.current = true
          if (headerRef.current) {
            headerRef.current.style.transition = 'transform 0.35s ease'
            headerRef.current.style.transform  = `translateY(${-COMPACT_HEIGHT}px)`
          }
          offsetY.current = -COMPACT_HEIGHT

          exitTimerRef.current = setTimeout(() => {
            pendingExitRef.current = false
            exitTimerRef.current   = null
            setFixed(false)
            if (headerRef.current) {
              headerRef.current.style.transition = ''
              headerRef.current.style.transform  = ''
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
          headerRef.current.style.transform  = `translateY(${-COMPACT_HEIGHT}px)`
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

        <button className={styles.header__menu} type="button" aria-label={t('menu')}>
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
                <Link key={l} href="/" locale={l} className={styles.header__lang_option}>
                  {l.toUpperCase()}
                </Link>
              ))}
            </div>
            <span className={styles.header__lang_current}>{locale.toUpperCase()}</span>
          </div>

          <Link href="/cart" className={styles.header__cart}>
            <IconCart />
            <span>{t('cart')}</span>
          </Link>

          <Link href="/account" className={styles.header__account}>
            <IconAccount />
            <span>{t('account')}</span>
          </Link>
        </div>

      </div>
    </header>
  )
}
