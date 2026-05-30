import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { pageBySlugQuery } from '@/sanity/lib/queries'
import Hero from '@/components/hero/Hero'
import PageBuilder from '@/components/page-builder/PageBuilder'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('home')

  const page = await client.fetch(pageBySlugQuery, { slug: 'home', locale })

  return (
    <>
      <Hero
        title={page?.heroTitle ?? page?.title ?? t('hero_title')}
        subtitle={page?.heroSubtitle ?? t('hero_subtitle')}
        backgroundImage={page?.heroImage}
      />
      {page?.sections && (
        <PageBuilder sections={page.sections} locale={locale} />
      )}
    </>
  )
}
