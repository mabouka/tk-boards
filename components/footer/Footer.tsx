import { Link } from '@/i18n/navigation'
import { client } from '@/sanity/lib/client'
import { footerSeriesQuery, navigationQuery, siteSettingsQuery } from '@/sanity/lib/queries'
import LogoTK from '@/components/icons/LogoTK'
import IconFacebook from '@/components/icons/IconFacebook'
import IconInstagram from '@/components/icons/IconInstagram'
import IconTikTok from '@/components/icons/IconTikTok'
import IconYoutube from '@/components/icons/IconYoutube'
import styles from './Footer.module.css'

type Props = { locale: string }

type NavItem = { label: string; slug?: string; externalUrl?: string; openInNewTab?: boolean }

const SITEMAP_FALLBACK = [
  { label: 'Home',         href: '/' },
  { label: 'Boards',       href: '/boards' },
  { label: 'Our Story',    href: '/our-story' },
  { label: 'Where to buy', href: '/where-to-buy' },
  { label: 'FAQ',          href: '/faq' },
  { label: 'Contact',      href: '/contact' },
]

export default async function Footer({ locale }: Props) {
  const [series, settings, nav] = await Promise.all([
    client.fetch(footerSeriesQuery, { locale }),
    client.fetch(siteSettingsQuery),
    client.fetch(navigationQuery, { title: 'Footer Sitemap' }),
  ])

  const navItems: NavItem[] = nav?.items ?? []

  const social = settings?.social ?? {}

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__grid}>

        {/* ── Col 1 : Logo + Social ── */}
        <div className={styles.footer__brand}>
          <Link href="/" aria-label="TK Boards — Home">
            <LogoTK className={styles.footer__logo} />
          </Link>
          <div className={styles.footer__social}>
            {social.facebook  && <a href={social.facebook}  target="_blank" rel="noopener noreferrer" aria-label="Facebook"><IconFacebook /></a>}
            {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><IconInstagram /></a>}
            {social.tiktok    && <a href={social.tiktok}    target="_blank" rel="noopener noreferrer" aria-label="TikTok"><IconTikTok /></a>}
            {social.youtube   && <a href={social.youtube}   target="_blank" rel="noopener noreferrer" aria-label="YouTube"><IconYoutube /></a>}
          </div>
        </div>

        {/* ── Col 2 & 3 : Series ── */}
        {series.map((s: { _id: string; name: string; boards: { _id: string; name: string; slug: { current: string } }[] }) => (
          <div key={s._id} className={styles.footer__series}>
            <p className={styles.footer__series_label}>{s.name}</p>
            <ul>
              {s.boards.map((b: { _id: string; name: string; slug: { current: string } }) => (
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
          <p className={styles.footer__series_label}>Sitemap</p>
          <ul>
            {navItems.length > 0
              ? navItems.map((item) => {
                  const href = item.slug ? `/${item.slug}` : (item.externalUrl ?? '#')
                  return (
                    <li key={href}>
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

      {/* ── Legal ── */}
      <div className={styles.footer__legal}>
        <Link href="/privacy-policy" className={styles.footer__legal_link}>Privacy Policy</Link>
        <Link href="/cookie-policy"  className={styles.footer__legal_link}>Cookie Policy</Link>
      </div>
    </footer>
  )
}
