import type { SanityImageSource } from '@sanity/image-url'
import Header from '@/components/layout/header/Header'
import Footer from '@/components/layout/footer/Footer'
import MainMenu from '@/components/layout/menu/MainMenu'
import { MenuProvider } from '@/components/layout/menu/MenuContext'
import { CartProvider } from '@/components/commerce/cart/CartContext'
import CartDrawer from '@/components/commerce/cart/CartDrawer'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { navigationQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { getSiteSettings } from '@/lib/metadata'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import LiveRefresh from '@/components/visual-editing/LiveRefresh'
import DraftModeBanner from '@/components/visual-editing/DraftModeBanner'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

type RawNavItem = {
  _key: string
  label: string
  href: string | null
  openInNewTab: boolean | null
}

type RawFeatured = {
  _key: string
  name: string | null
  slug: string | null
  image: SanityImageSource | null
}

// Map a navigation document's `items` to the shape <MainMenu /> expects.
// The query already computes the full href (handles homePage → "/", other
// internal pages → "/<slug>", and external URLs), so we just relay it.
// `_key` (the stable Sanity array key) is carried through for React keys.
function toNavItems(items: unknown) {
  return ((items ?? []) as RawNavItem[])
    .filter((i) => i.label && i.href)
    .map((i) => ({
      _key: i._key,
      label: i.label,
      href: i.href as string,
      openInNewTab: Boolean(i.openInNewTab),
    }))
}

export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params
  const { isEnabled: isDraft } = await draftMode()

  // Main menu = the navigation document whose Location is "Header". Falls back to
  // built-in lists inside <MainMenu /> when none is published.
  const [nav, featuredNav, legalNav, settings] = await Promise.all([
    client.fetch(navigationQuery, { location: 'header', locale }, sanityCache('navigation')),
    client.fetch(navigationQuery, { location: 'featured', locale }, sanityCache('navigation')),
    client.fetch(navigationQuery, { location: 'legal', locale }, sanityCache('navigation')),
    getSiteSettings(locale),
  ])

  const navItems = toNavItems(nav?.items)
  const legalItems = toNavItems(legalNav?.items)

  const featuredBoards = ((featuredNav?.featured ?? []) as RawFeatured[])
    .filter((f): f is RawFeatured & { name: string; image: SanityImageSource } =>
      Boolean(f.name && f.image)
    )
    .map((f) => ({
      _key: f._key,
      name: f.name,
      href: f.slug ? `/boards/${f.slug}` : '#',
      // Darkened + blurred backdrop — 1600px is plenty (was 2560).
      image: urlFor(f.image).width(1600).quality(85).auto('format').url(),
    }))

  const socials = Object.entries(settings?.social ?? {})
    .filter(([, url]) => typeof url === 'string' && url)
    .map(([key, url]) => ({ key, url: url as string }))

  return (
    <CartProvider>
      <MenuProvider>
        <Header locale={locale} />
        <main>{children}</main>
        <Footer locale={locale} />
        <MainMenu
          navItems={navItems}
          legalItems={legalItems}
          featuredBoards={featuredBoards}
          socials={socials}
        />
        <CartDrawer locale={locale} />
        {isDraft && (
          <>
            <LiveRefresh token={process.env.SANITY_API_READ_TOKEN} />
            <VisualEditing />
            <DraftModeBanner />
          </>
        )}
      </MenuProvider>
    </CartProvider>
  )
}
