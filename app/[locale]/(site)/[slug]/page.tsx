import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { cmsPageBySlugQuery } from '@/sanity/lib/queries'
import BigTitle from '@/components/placeholder/BigTitle'

type Props = { params: Promise<{ locale: string; slug: string }> }

// Polymorphic CMS route: resolves any page type (page, ourStoryPage, contactPage,
// faqPage, whereToBuyPage) by slug+locale. Static routes keep precedence.
// Renders just a big title for now — real templates per _type come later.
export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params
  const page = await client.fetch(cmsPageBySlugQuery, { slug, locale })
  if (!page) notFound()

  return <BigTitle>{page.title}</BigTitle>
}
