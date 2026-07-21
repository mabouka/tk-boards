import { Link } from '@/i18n/navigation'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { footerSeriesQuery, navigationQuery } from '@/sanity/lib/queries'
import { getSiteSettings } from '@/lib/metadata'
import LogoTK from '@/components/ui/icons/LogoTK'
import IconFacebook from '@/components/ui/icons/IconFacebook'
import IconGoogle from '@/components/ui/icons/IconGoogle'
import IconInstagram from '@/components/ui/icons/IconInstagram'
import IconLinkedin from '@/components/ui/icons/IconLinkedin'
import IconMessenger from '@/components/ui/icons/IconMessenger'
import IconTikTok from '@/components/ui/icons/IconTikTok'
import IconWhatsapp from '@/components/ui/icons/IconWhatsapp'
import IconX from '@/components/ui/icons/IconX'
import IconYoutube from '@/components/ui/icons/IconYoutube'
import { haloProps } from '@/components/ui/halo/haloProps'
import styles from './Footer.module.css'

type Props = { locale: string }

type NavItem = { _key: string; label: string; href: string | null; openInNewTab: boolean | null }

const SITEMAP_FALLBACK = [
  { label: 'Home', href: '/' },
  { label: 'Boards', href: '/boards' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Where to buy', href: '/where-to-buy' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
]

export default async function Footer({ locale }: Props) {
  const [series, settings, nav] = await Promise.all([
    client.fetch(footerSeriesQuery, { locale }, sanityCache('series', 'board')),
    getSiteSettings(locale),
    client.fetch(navigationQuery, { location: 'footer', locale }, sanityCache('navigation')),
  ])

  // Keep only items that have a label and a destination (guards against
  // half-filled nav documents — e.g. labels not yet translated).
  const navItems: NavItem[] = (nav?.items ?? []).filter(
    (item: NavItem) => item.label && item.href
  )

  const social = settings?.social ?? {}

  return (
    <footer className={styles.footer}>
      <div
        className={styles.footer__grid}
        {...haloProps({ rgb: '225, 225, 255', opacity: 0.15, w: '100vw', h: '47vh', spread: '2%', anchor: 'bottom-right' })}
      >

        {/* ── Col 1 : Logo + Social ── */}
        <div className={styles.footer__brand}>
          <Link href="/" aria-label="TK Boards — Home">
            <LogoTK className={styles.footer__logo} />
          </Link>

          <div className={styles.footer__text}>
            Just play. <br></br>We’ll take care of the rest.
          </div>

          <div className={styles.footer__social}>
            {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IconFacebook /></a>}
            {social.google && <a href={social.google} target="_blank" rel="noopener noreferrer" aria-label="Google"><IconGoogle /></a>}
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IconInstagram /></a>}
            {social.linkedin && <a href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><IconLinkedin /></a>}
            {social.messenger && <a href={social.messenger} target="_blank" rel="noopener noreferrer" aria-label="Messenger"><IconMessenger /></a>}
            {social.tiktok && <a href={social.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok"><IconTikTok /></a>}
            {social.whatsapp && <a href={social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><IconWhatsapp /></a>}
            {social.x && <a href={social.x} target="_blank" rel="noopener noreferrer" aria-label="X"><IconX /></a>}
            {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"><IconYoutube /></a>}
          </div>
        </div>

        {/* ── Col 2 & 3 : Series ── */}
        {series.map((s) => (
          <div key={s._id} className={styles.footer__series}>
            <p className={styles.footer__series_label}>{s.name}</p>
            <ul>
              {s.boards.map((b) => (
                <li key={b._id}>
                  <Link href={`/boards/${b.slug.current}`} className={styles.footer__board_link}>
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* ── Col 4 : Sitemap ── */}
        <nav className={styles.footer__sitemap} aria-label="Sitemap">
          <h2 className={styles.footer__series_label}>Sitemap</h2>
          <ul>
            {navItems.length > 0
              ? navItems.map((item) => {
                const href = item.href ?? '#'
                return (
                  <li key={item._key}>
                    <Link
                      href={href}
                      className={styles.footer__nav_link}
                      {...(item.openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })
              : SITEMAP_FALLBACK.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className={styles.footer__nav_link}>{label}</Link>
                </li>
              ))
            }
          </ul>
        </nav>

      </div>

      {/* ── Bottom ── */}
      <div className={styles.footer__bottom}>
        <p className={styles.footer_copyright}>&copy; {new Date().getFullYear()} TK Boards. All rights reserved.</p>
        <div className={styles.footer__legal}>
          <Link href="/privacy-policy" className={styles.footer__legal_link}>Privacy Policy</Link>
          <Link href="/cookie-policy" className={styles.footer__legal_link}>Cookie Policy</Link>
        </div>
      </div>
    </footer>
  )
}
