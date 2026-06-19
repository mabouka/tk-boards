import { headers } from 'next/headers'
import type { ContactPageQueryResult } from '@/sanity.types'
import BasicHero from '@/components/basic-hero/BasicHero'
import IconWhatsapp from '@/components/icons/IconWhatsapp'
import IconMail from '@/components/icons/IconMail'
import ContactForm from './ContactForm'
import PageBuilder from '@/components/page-builder/PageBuilder'
import { haloProps } from '@/components/halo/haloProps'
import styles from './ContactPage.module.css'

type Sections = NonNullable<ContactPageQueryResult>['sections']

type Props = {
  heroTitle?: string | null
  heroSubtitle?: string | null
  heroImageUrl?: string | null
  heroImageAlt?: string | null
  introEyebrow?: string | null
  introTitle?: string | null
  intro?: string | null
  whatsapp?: string | null
  email?: string | null
  sections?: Sections
  locale: string
}

const DEFAULT_INTRO = [
  'Every TK board is born from a constant pursuit of sensation, craftsmanship and performance.',
  'Whether you have a question about a board or simply want to connect with the TK world, we’re always happy to hear from fellow riders.',
  'From the workshop to the water, we’re here to help.',
]

export default async function ContactPage({
  heroTitle,
  heroSubtitle,
  heroImageUrl,
  heroImageAlt,
  introEyebrow,
  introTitle,
  intro,
  whatsapp,
  email,
  sections,
  locale,
}: Props) {
  const waNumber = whatsapp?.replace(/\D/g, '') ?? ''
  // Default the phone country to the visitor's IP country (Vercel geo header);
  // falls back to FR locally or when the header is absent.
  const ipCountry = (await headers()).get('x-vercel-ip-country')
  const phoneCountry = ipCountry && /^[a-z]{2}$/i.test(ipCountry) ? ipCountry.toLowerCase() : 'fr'

  // Intro body: split the Sanity text on blank lines into paragraphs.
  const paragraphs = intro?.trim()
    ? intro
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : DEFAULT_INTRO

  return (
    <main className={styles.main}>
      <BasicHero
        title={heroTitle || 'Contact us'}
        subtitle={heroSubtitle || 'Drop us a line'}
        imageUrl={heroImageUrl || '/samples/channel.jpg'}
        imageAlt={heroImageAlt || ''}
      />

      <div
        className={styles.page}
        {...haloProps({ rgb: '225, 255, 255', opacity: 0.23, w: '113vw', h: '99vh', spread: '24%', anchor: 'top-right' })}
      >
        <div className={styles.grid}>
          {/* ── Left: pitch ──────────────────────────────── */}
          <div className={styles.intro}>
            <p className={styles.eyebrow}>{introEyebrow || 'Contact'}</p>
            <h2 className={styles.title}>
              {introTitle || 'Every great ride starts with a conversation.'}
            </h2>
            <div className={styles.lead}>
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {(waNumber || email) && (
              <div className={styles.actions}>
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.actionBtn}
                  >
                    <IconWhatsapp className={`${styles.actionIcon} ${styles.iconWa}`} />
                    Chat on WhatsApp
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className={styles.actionBtn}>
                    <IconMail className={styles.actionIcon} />
                    Email us
                  </a>
                )}
              </div>
            )}
          </div>

          {/* ── Right: form card ─────────────────────────── */}
          <div className={styles.card}>
            <ContactForm phoneCountry={phoneCountry} />
          </div>
        </div>
      </div>

      {/* ── Content sections (page builder) ──────────────── */}
      {sections && sections.length > 0 && <PageBuilder sections={sections} locale={locale} />}
    </main>
  )
}
