import type { SanityImageSource } from '@sanity/image-url'
import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'
import MainMenu from '@/components/menu/MainMenu'
import { MenuProvider } from '@/components/menu/MenuContext'
import { client } from '@/sanity/lib/client'
import { navigationQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { getSiteSettings } from '@/lib/metadata'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

type RawNavItem = {
  label: string
  slug: string | null
  externalUrl: string | null
  openInNewTab: boolean | null
}

type RawFeatured = { name: string | null; slug: string | null; image: SanityImageSource | null }

// Map a navigation document's `items` to the shape <MainMenu /> expects.
function toNavItems(items: unknown) {
  return ((items ?? []) as RawNavItem[])
    .filter((i) => i.label && (i.slug || i.externalUrl))
    .map((i) => ({
      label: i.label,
      href: i.slug ? `/${i.slug}` : (i.externalUrl ?? '#'),
      openInNewTab: Boolean(i.openInNewTab),
    }))
}

export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params

  // Main menu = the navigation document whose Location is "Header". Falls back to
  // built-in lists inside <MainMenu /> when none is published.
  const [nav, featuredNav, legalNav, settings] = await Promise.all([
    client.fetch(navigationQuery, { location: 'header', locale }),
    client.fetch(navigationQuery, { location: 'featured', locale }),
    client.fetch(navigationQuery, { location: 'legal', locale }),
    getSiteSettings(locale),
  ])

  const navItems = toNavItems(nav?.items)
  const legalItems = toNavItems(legalNav?.items)

  const featuredBoards = ((featuredNav?.featured ?? []) as RawFeatured[])
    .filter((f): f is RawFeatured & { name: string; image: SanityImageSource } =>
      Boolean(f.name && f.image)
    )
    .map((f) => ({
      name: f.name,
      href: f.slug ? `/boards/${f.slug}` : '#',
      image: urlFor(f.image).width(2560).quality(85).auto('format').url(),
    }))

  const socials = Object.entries(settings?.social ?? {})
    .filter(([, url]) => typeof url === 'string' && url)
    .map(([key, url]) => ({ key, url: url as string }))

  return (
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
    </MenuProvider>
  )
}
