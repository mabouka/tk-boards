import styles from './design-system.module.css'

export default function DesignSystemPage() {
  return (
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

    </main>
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
