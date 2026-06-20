/** Small fixed pill shown while previewing drafts, with a link to exit preview. */
export default function DraftModeBanner() {
  return (
    // Full navigation to an API route (clears the draft cookie, then redirects) —
    // a Next <Link> is for pages, not route handlers.
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      href="/api/draft-mode/disable"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 999,
        background: '#000',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.3)',
        font: '500 13px/1 system-ui, sans-serif',
        textDecoration: 'none',
      }}
    >
      ● Preview mode — Exit
    </a>
  )
}
