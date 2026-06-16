import styles from './design-system.module.css'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { boardBySlugQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage, PortableTextValue } from '@/sanity/lib/types'
import SectionTextGallery from '@/components/text-gallery/SectionTextGallery'
import SectionTextImage from '@/components/text-image/SectionTextImage'
import SectionFullMedia from '@/components/full-media/SectionFullMedia'
import SectionBigQuote from '@/components/big-quote/SectionBigQuote'
import SectionMediaLine from '@/components/media-line/SectionMediaLine'
import SectionFeatures from '@/components/features/SectionFeatures'
import SectionOutline from '@/components/outline/SectionOutline'

export default async function DesignSystemPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Real Sanity images for the Text + Gallery preview.
  // Prefer the EN Rocket (richest gallery); fall back to the page locale.
  const board =
    (await client.fetch(boardBySlugQuery, { locale: 'en', slug: 'rocket' }, sanityCache('board'))) ??
    (await client.fetch(boardBySlugQuery, { locale, slug: 'rocket' }, sanityCache('board')))

  const galleryPreview = [board?.mainImage, ...(board?.gallery ?? []), board?.heroImage]
    .filter(Boolean)
    .slice(0, 4) as unknown as SanityImage[]

  // Sample data for the Features slider preview (image-or-video + optional CTA).
  const featureSample = [
    { title: 'Confort sur mesure', text: 'Chaque pad de traction est façonné à la main, avec des rails en relief, pour un grab naturel, précis et confortable.' },
    { title: 'Un tail fait pour le pop', text: 'Un tail fait pour sauter qui rend chaque pop plus explosif. Ses ailerons plus fins et nerveux permettent une maniabilité maîtrisée.', cta: { text: 'En savoir plus', href: '#' } },
    { title: 'Carbone sergé biaxial', text: 'Une coque carbone haute résistance pour une rigidité et une réactivité sans compromis.' },
    { title: 'Façonné à Tarifa', text: "Un travail d'orfèvrerie, board après board, dans notre atelier en Espagne." },
  ]
  const featureItems = featureSample.map((f, i) => ({
    ...f,
    imageUrl: galleryPreview[i % Math.max(galleryPreview.length, 1)]
      ? urlFor(galleryPreview[i % galleryPreview.length]).width(900).height(628).quality(85).url()
      : undefined,
  }))
  // Demonstrate "image OR video": swap the 3rd item to a video.
  const featureItemsMixed = featureItems.map((f, i) =>
    i === 2
      ? { ...f, imageUrl: undefined, videoUrl: 'https://customer-se4p8jzilnf43xyu.cloudflarestream.com/40edf58cdba22802adf01fc5a5404cb5/downloads/default.mp4', videoPoster: f.imageUrl }
      : f
  )

  // Outline timeline — the 4 shape-evolution SVGs from the prototype.
  const outlineMilestones = [
    { year: '1970', name: 'Surf classique', tag: 'Origine', svgPath: 'M 50,10 C 64,10 82,50 84,138 C 86,218 78,268 70,286 L 50,290 L 30,286 C 22,268 14,218 16,138 C 18,50 36,10 50,10 Z' },
    { year: '2004', name: 'First freestyle shape', tag: 'Smaller tail', svgPath: 'M 50,10 C 60,10 74,44 76,128 C 78,206 72,260 65,280 L 50,290 L 35,280 C 28,260 22,206 24,128 C 26,44 40,10 50,10 Z' },
    { year: '2015', name: 'Square shape', tag: 'Round nose', svgPath: 'M 50,10 C 66,10 86,50 89,126 C 91,184 84,234 74,260 L 64,278 L 57,271 L 50,275 L 43,271 L 36,278 L 26,260 C 16,234 9,184 11,126 C 14,50 34,10 50,10 Z' },
    { year: '2015', name: 'The Rocket', tag: 'Perfect One', svgPath: 'M 48.9,5.0 C 53.9,5.5 57.0,6.0 63.0,7.9 C 71.5,10.4 74.1,13.3 78.7,24.6 C 83.0,35.1 85.5,46.9 86.5,67.0 C 87.8,92.7 90.6,197.1 91.0,232.7 C 91.2,253.5 88.4,268.5 85.1,277.9 C 83.3,283.9 80.5,288.7 76.1,291.1 C 70.5,293.7 59.2,295.0 50.2,295.0 C 41.2,295.0 31.2,294.2 25.6,291.6 C 21.1,289.3 18.4,287.2 14.9,278.1 C 11.4,268.7 9.0,253.6 9.2,232.8 C 9.6,197.2 12.0,90.4 13.2,64.7 C 14.3,43.3 17.2,33.8 19.9,26.4 C 24.5,13.4 27.4,9.7 35.9,7.5 C 40.3,6.4 44.1,5.4 48.9,5.0 Z' },
  ]

  const sampleBody = [
    {
      _type: 'block',
      _key: 'p1',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 's1',
          marks: [],
          text: 'La TK Rocket est conçue avec un noyau bois de paulownia sélectionné pour ses qualités mécaniques exceptionnelles, offrant un rapport nervosité / légèreté parfait, associé à un carbone sergé biaxial haute résistance.',
        },
      ],
    },
    {
      _type: 'block',
      _key: 'p2',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 's2',
          marks: [],
          text: "Un travail d'orfèvrerie garantissant une rigidité, une réactivité et une légèreté inégalée, sans compromis de style.",
        },
      ],
    },
  ] as unknown as PortableTextValue

  return (
    <>
      <main style={{ padding: '64px 48px', maxWidth: 1400, margin: '0 auto' }}>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: 80 }}>
          TK Boards — Design System
        </h1>

        {/* ── Colors ─────────────────────────────────────────── */}
        <Section title="Colors">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {[
              { name: '--color-dark',      value: '#0d0f14' },
              { name: '--color-black',     value: '#000000' },
              { name: '--color-carbon',    value: '#3a3a3e' },
              { name: '--color-muted',     value: '#9a9a9a' },
              { name: '--color-white',     value: '#ffffff' },
              { name: '--color-cream',     value: '#f5f4f0' },
              { name: '--color-gold',      value: '#c9a478' },
              { name: '--color-paulownia', value: '#E2C9A2' },
              { name: '--color-red',       value: '#8b1a1a' },
            ].map(({ name, value }) => (
              <div key={name} style={{ width: 120 }}>
                <div style={{ width: 120, height: 80, background: `var(${name})`, border: '1px solid rgba(255,255,255,0.1)' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--color-muted)', marginTop: 8 }}>{name}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: 'var(--color-muted)' }}>{value}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Typography ─────────────────────────────────────── */}
        <Section title="Typography">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <Row label="u-title-96"><h2 className="u-title u-title--96" style={{ color: 'var(--color-white)' }}>TK Boards</h2></Row>
            <Row label="u-title-66"><h2 className="u-title u-title--66" style={{ color: 'var(--color-white)' }}>Our Boards</h2></Row>
            <Row label="u-title-48"><h2 className="u-title u-title--48" style={{ color: 'var(--color-white)' }}>Carbon Series</h2></Row>
            <Row label="u-title-36"><h2 className="u-title u-title--36" style={{ color: 'var(--color-white)' }}>Phantom Pro</h2></Row>
            <Row label="u-title-24"><h2 className="u-title u-title--24" style={{ color: 'var(--color-white)' }}>Phantom Pro</h2></Row>
            <Row label="u-label-mono"><span className="u-label-mono">Handcrafted in Tarifa</span></Row>
          </div>
        </Section>

        {/* ── CTA Buttons ────────────────────────────────────── */}
        <Section title="CTA Buttons">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '32px', background: 'var(--color-dark)' }}>
              <button className="u-cta u-cta--white-fill">White Fill</button>
              <button className="u-cta u-cta--white-outline">White Outline</button>
              <button className="u-cta u-cta--black-fill">Black Fill</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '32px', background: 'var(--color-cream)' }}>
              <button className="u-cta u-cta--black-fill">Black Fill</button>
              <button className="u-cta u-cta--black-outline">Black Outline</button>
              <button className="u-cta u-cta--white-fill">White Fill</button>
            </div>
          </div>
        </Section>

        {/* ── Tab Filters ────────────────────────────────────── */}
        <Section title="Tab Filters">
          <div className="u-tab-filters" style={{ display: 'inline-flex' }}>
            <button className="u-tab-filter u-tab-filter--active">Carbon</button>
            <button className="u-tab-filter">Tiki</button>
            <button className="u-tab-filter">Wave</button>
          </div>
        </Section>

        {/* ── Tags ───────────────────────────────────────────── */}
        <Section title="Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Row label="u-tag--dark">         <span className="u-tag u-tag--dark">Carbon ×2</span></Row>
            <Row label="u-tag--cream">        <span className="u-tag u-tag--cream">In Stock</span></Row>
            <Row label="u-tag--amber">        <span className="u-tag u-tag--amber">Paulownia Core</span></Row>
            <Row label="u-tag--red">          <span className="u-tag u-tag--red">Sold Out</span></Row>
            <Row label="u-tag--outline-light"><span className="u-tag u-tag--outline-light">Made in BE</span></Row>
            <Row label="u-tag--outline-muted"><span className="u-tag u-tag--outline-muted">Lot №·047</span></Row>
          </div>
        </Section>

        {/* ── Grid ───────────────────────────────────────────── */}
        <Section title="Grid — col()">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([1, 2, 3, 4, 6, 8, 12] as const).map(n => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: 'var(--color-muted)', width: 60, textTransform: 'uppercase' }}>col({n})</span>
                <div className={`${styles['col-' + n]} ${styles['col-bar']}`}>
                  <span className={styles['col-label']}>{n} col{n > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Section: Text + Gallery (previews below, full-width) ── */}
        <Section title="Section — Text + Gallery">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Clique sur une vignette → l&apos;image principale change, le texte ne bouge pas.<br />
            Les 4 combinaisons (image gauche/droite × light/dark) sont affichées en pleine largeur ci-dessous.
          </p>
        </Section>

        <Section title="Section — Text + Image">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--color-muted)', lineHeight: 1.6 }}>
            Full (image bleed 50vw) &amp; contained (image insérée) × light/dark × image gauche/droite.<br />
            Les 4 combinaisons sont affichées en pleine largeur ci-dessous.
          </p>
        </Section>

      </main>

      {/* Full-width previews — u-grid is computed from 100vw, so outside the centered <main>.
          position/zIndex lift them above the BackgroundCanvas (z-index 0), like <main>. */}
      {galleryPreview.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionTextGallery label="CORE" title={"Un coeur en\nPaulownia"} body={sampleBody} gallery={galleryPreview} theme="light" imagePosition="left" />
          <SectionTextGallery label="CORE" title={"Un coeur en\nPaulownia"} body={sampleBody} gallery={galleryPreview} theme="light" imagePosition="right" />
          <SectionTextGallery label="CORE" title={"Un coeur en\nPaulownia"} body={sampleBody} gallery={galleryPreview} theme="dark" imagePosition="left" />
          <SectionTextGallery label="CORE" title={"Un coeur en\nPaulownia"} body={sampleBody} gallery={galleryPreview} theme="dark" imagePosition="right" />
        </div>
      )}

      {/* Text + Image — full/contained × light/dark × left/right */}
      {galleryPreview.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionTextImage
            layout="full"
            theme="light"
            imagePosition="left"
            label="TECHNOLOGY"
            title={'Why are TK boards\ndifferent?'}
            body={sampleBody}
            image={galleryPreview[0]}
            ctas={[{ text: 'Our technology', href: '#' }]}
          />
          <SectionTextImage
            layout="full"
            theme="dark"
            imagePosition="right"
            label="TECHNOLOGY"
            title={'Why are TK boards\ndifferent?'}
            body={sampleBody}
            image={galleryPreview[0]}
            ctas={[{ text: 'Our technology', href: '#' }]}
          />
          <SectionTextImage
            layout="contained"
            theme="light"
            imagePosition="right"
            label="TK ID"
            title={'Every TK board carries\nits own identity.'}
            body={sampleBody}
            image={galleryPreview[0]}
            ctas={[
              { text: 'Discover TK ID', href: '#' },
              { text: 'Register your board', href: '#' },
            ]}
          />
          <SectionTextImage
            layout="contained"
            theme="dark"
            imagePosition="left"
            label="TK ID"
            title={'Every TK board carries\nits own identity.'}
            body={sampleBody}
            image={galleryPreview[0]}
            ctas={[
              { text: 'Discover TK ID', href: '#' },
              { text: 'Register your board', href: '#' },
            ]}
          />
        </div>
      )}

      {/* Full Media — image previews (video needs a Cloudflare Stream UID to test) */}
      {galleryPreview.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionFullMedia mediaType="image" image={galleryPreview[0]} />
          <SectionFullMedia mediaType="image" image={galleryPreview[0]} size="in-grid" />
          <SectionFullMedia
            mediaType="video"
            videoUrl="https://customer-se4p8jzilnf43xyu.cloudflarestream.com/40edf58cdba22802adf01fc5a5404cb5/downloads/default.mp4"
            videoPoster={galleryPreview[0]}
            videoWidth={1920}
            videoHeight={666}
          />
        </div>
      )}

      {/* Big Quote */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SectionBigQuote
          quote={'There’s no turning back\nonce you ride a TK.\nIt’s another league.'}
          authorName="Matheo"
          authorRole="Designer"
          theme="dark"
        />
      </div>

      {/* Media Line */}
      {galleryPreview.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionMediaLine
            media={[
              { mediaType: 'image', image: galleryPreview[0] },
              { mediaType: 'image', image: galleryPreview[1] ?? galleryPreview[0] },
            ]}
            aspectRatio="4 / 3"
            size="in-grid"
          />
        </div>
      )}

      {/* Features slider — light, dark, and image-or-video. Drag with the mouse or use the arrows. */}
      {galleryPreview.length > 0 && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SectionFeatures items={featureItems} theme="light" />
          <SectionFeatures items={featureItemsMixed} theme="dark" />
        </div>
      )}

      {/* Outline — shape evolution. Sticky scrub: scroll to fade+scale through eras. */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SectionOutline
          title={'Evolution du shape\ndu surf a la Rocket'}
          intro="Vingt ans de R&D condensés dans un seul shape. Au début les planches directionnelles de kitesurf sont inspirées du surf ; au cours des années, elles ont évolué en réduisant le volume, en modifiant le tail, en ajoutant des pads."
          milestones={outlineMilestones}
          finalImageUrl="/samples/rocket.png"
          finalLabel={{ title: 'TK Rocket', subtitle: 'Freestyle Strapless' }}
        />
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: 1, background: 'var(--color-carbon)' }} />
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: 'var(--color-muted)', textTransform: 'uppercase', width: 180, flexShrink: 0 }}>
        {label}
      </span>
      {children}
    </div>
  )
}
