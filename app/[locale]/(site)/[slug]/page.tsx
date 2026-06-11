import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { pageBySlugQuery } from '@/sanity/lib/queries'
import BigTitle from '@/components/placeholder/BigTitle'

type Props = { params: Promise<{ locale: string; slug: string }> }

// Sanity-driven CMS page. Minimal for now: just the big title (no template yet).
export default async function SanityPage({ params }: Props) {
  const { locale, slug } = await params
  const page = await client.fetch(pageBySlugQuery, { slug, locale })
  if (!page) notFound()

  return <BigTitle>{page.heroTitle || page.title}</BigTitle>
}
