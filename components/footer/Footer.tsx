import { Link } from '@/i18n/navigation'
import { client } from '@/sanity/lib/client'
import { footerSeriesQuery, navigationQuery, siteSettingsQuery } from '@/sanity/lib/queries'
import LogoTK from '@/components/icons/LogoTK'
import IconFacebook from '@/components/icons/IconFacebook'
import IconGoogle from '@/components/icons/IconGoogle'
import IconInstagram from '@/components/icons/IconInstagram'
import IconLinkedin from '@/components/icons/IconLinkedin'
import IconMessenger from '@/components/icons/IconMessenger'
import IconTikTok from '@/components/icons/IconTikTok'
import IconWhatsapp from '@/components/icons/IconWhatsapp'
import IconX from '@/components/icons/IconX'
import IconYoutube from '@/components/icons/IconYoutube'
import styles from './Footer.module.css'

type Props = { locale: string }

type NavItem = { label: string; slug?: string; externalUrl?: string; openInNewTab?: boolean }

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
    client.fetch(footerSeriesQuery, { locale }),
    client.fetch(siteSettingsQuery),
    client.fetch(navigationQuery, { title: 'Footer Sitemap' }),
  ])

  const navItems: NavItem[] = nav?.items ?? []

  const social = settings?.social ?? {}

  return (
    <footer className={styles.footer}>
      <div
        className={styles.footer__grid}
        data-halo
        data-halo-rgb="225, 225, 255"
        data-halo-opacity="0.23"
        data-halo-w="122vw"
        data-halo-h="47vh"
        data-halo-spread="23%"
        data-halo-anchor="bottom-right"
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
