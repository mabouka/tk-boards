'use client'

import { useState } from 'react'
import { useDrawer } from '@/lib/use-drawer'
import { Link } from '@/i18n/navigation'
import LogoTK from '@/components/ui/icons/LogoTK'
import IconInstagram from '@/components/ui/icons/IconInstagram'
import IconFacebook from '@/components/ui/icons/IconFacebook'
import IconLinkedin from '@/components/ui/icons/IconLinkedin'
import IconTikTok from '@/components/ui/icons/IconTikTok'
import IconYoutube from '@/components/ui/icons/IconYoutube'
import IconX from '@/components/ui/icons/IconX'
import IconMessenger from '@/components/ui/icons/IconMessenger'
import IconWhatsapp from '@/components/ui/icons/IconWhatsapp'
import IconGoogle from '@/components/ui/icons/IconGoogle'
import { useMenu } from './MenuContext'
import styles from './MainMenu.module.css'

export type MenuNavItem = { _key: string; label: string; href: string; openInNewTab: boolean }
export type MenuFeaturedBoard = { _key: string; name: string; href: string; image: string }
export type MenuSocial = { key: string; url: string }

type IconComponent = React.ComponentType<{ className?: string }>

const SOCIAL_ICONS: Record<string, IconComponent> = {
  instagram: IconInstagram,
  facebook: IconFacebook,
  linkedin: IconLinkedin,
  tiktok: IconTikTok,
  youtube: IconYoutube,
  x: IconX,
  messenger: IconMessenger,
  whatsapp: IconWhatsapp,
  google: IconGoogle,
}

export default function MainMenu({
  navItems = [],
  legalItems = [],
  featuredBoards = [],
  socials = [],
}: {
  navItems?: MenuNavItem[]
  legalItems?: MenuNavItem[]
  featuredBoards?: MenuFeaturedBoard[]
  socials?: MenuSocial[]
}) {
  const { open, setOpen } = useMenu()
  const close = () => setOpen(false)
  const [hovered, setHovered] = useState<number | null>(null)

  const socialLinks = socials.filter((s) => SOCIAL_ICONS[s.key])

  // Close on Escape + lock body scroll while open.
  useDrawer(open, close)

  return (
    <div className={`${styles.menu} ${open ? styles.menuOpen : ''}`} aria-hidden={!open}>
      {/* Background board image — fades in on hover of a featured board.
          Only mounted while the menu is open, so the (large) backdrops aren't
          fetched on every page load — only once the overlay is actually shown. */}
      <div className={styles.bg}>
        {open &&
          featuredBoards.map((b, i) => (
            <div
              key={b._key}
              className={styles.bgImage}
              style={{ backgroundImage: `url("${b.image}")`, opacity: hovered === i ? 1 : 0 }}
            />
          ))}
        <div className={styles.bgGradient} />
      </div>

      <div className={styles.inner}>
        <div className={styles.bar}>
          <Link href="/" className={styles.logo} onClick={close} aria-label="TK Boards">
            <LogoTK />
          </Link>
          <button className={styles.close} type="button" onClick={close} aria-label="Fermer le menu">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          {/* Featured boards (left) */}
          <nav className={styles.boards} aria-label="Planches en vedette">
            {featuredBoards.map((b, i) => (
              <Link
                key={b._key}
                href={b.href}
                className={styles.boardLink}
                data-dim={hovered !== null && hovered !== i ? '' : undefined}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                onClick={close}
              >
                {b.name}
              </Link>
            ))}
          </nav>

          {/* Main navigation (right) */}
          <nav className={styles.nav} aria-label="Navigation principale">
            {navItems.map((item) => (
              <Link
                key={item._key}
                href={item.href}
                className={styles.navLink}
                onClick={close}
                {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.foot}>
          <div className={styles.legal}>
            {legalItems.map((item) => (
              <Link
                key={item._key}
                href={item.href}
                onClick={close}
                {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.socials}>
            {socialLinks.map(({ key, url }) => {
              const Icon = SOCIAL_ICONS[key]
              return (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={key}>
                  <Icon />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
