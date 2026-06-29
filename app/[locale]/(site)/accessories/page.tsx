import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import {
  accessoriesQuery,
  accessoryCategoriesQuery,
  accessoriesPageSettingsQuery,
} from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { buildMetadata, getSiteSettings } from '@/lib/metadata'
import AccessoriesClient from '@/components/sections/accessories/AccessoriesClient'
import PageBuilder from '@/components/sections/page-builder/PageBuilder'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [t, settings, page] = await Promise.all([
    getTranslations({ locale, namespace: 'accessories' }),
    getSiteSettings(locale),
    client.fetch(accessoriesPageSettingsQuery, { locale }, sanityCache('accessoriesPageSettings')),
  ])

  return buildMetadata({
    locale,
    path: '/accessories',
    title: page?.seoTitle || page?.title || t('title'),
    absoluteTitle: Boolean(page?.seoTitle),
    description: page?.seoDescription || settings?.seoDescription || undefined,
    image: page?.ogImage ?? undefined,
    imageAlt: page?.ogImage?.alt ?? page?.title ?? t('title'),
    alternateLanguages: true,
  })
}

export default async function AccessoriesPage({ params }: Props) {
  const { locale } = await params
  const [t, settings, categories, accessories] = await Promise.all([
    getTranslations('accessories'),
    client.fetch(accessoriesPageSettingsQuery, { locale }, sanityCache('accessoriesPageSettings')),
    client.fetch(accessoryCategoriesQuery, { locale }, sanityCache('accessoryCategory')),
    client.fetch(accessoriesQuery, { locale }, sanityCache('accessory')),
  ])

  const items = accessories.map((a) => ({
    _id: a._id,
    title: a.title,
    slug: a.slug?.current ?? '',
    imageUrl: a.mainImage ? urlFor(a.mainImage).width(800).height(800).quality(85).url() : null,
    categoryName: a.category?.name ?? null,
    categorySlug: a.category?.slug ?? null,
  }))

  return (
    <>
      <AccessoriesClient
        title={settings?.title || t('title')}
        allLabel={t('all')}
        showFilters={settings?.showFilters !== false}
        categories={categories}
        accessories={items}
      />

      {/* Editor-managed sections, rendered after the accessory listing. */}
      {settings?.sections && settings.sections.length > 0 && (
        <PageBuilder sections={settings.sections} locale={locale} />
      )}
    </>
  )
}
