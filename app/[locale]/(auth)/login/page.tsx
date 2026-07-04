import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { auth } from '@/auth'
import { buildMetadata } from '@/lib/metadata'
import { client } from '@/sanity/lib/client'
import { sanityCache } from '@/sanity/lib/fetch'
import { authPageQuery } from '@/sanity/lib/queries'
import AuthFlow from '../AuthFlow'

type Props = {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [authContent, t] = await Promise.all([
    client.fetch(authPageQuery, { locale }, sanityCache('authPage')),
    getTranslations('auth'),
  ])
  return buildMetadata({
    locale,
    path: '/login',
    title: authContent?.seoTitle || t('title'),
    absoluteTitle: Boolean(authContent?.seoTitle),
    description: authContent?.seoDescription || undefined,
    image: authContent?.ogImage ?? undefined,
    imageAlt: authContent?.ogImage?.alt ?? undefined,
  })
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params

  const session = await auth()
  const sp = searchParams ? await searchParams : {}
  const callbackUrl = typeof sp.callbackUrl === 'string' ? sp.callbackUrl : undefined

  // Already logged in → honour a safe relative callback (e.g. back to a TK-ID
  // registration), otherwise the account page.
  if (session?.user?.id) {
    redirect(callbackUrl && /^\/(?![/\\])/.test(callbackUrl) ? callbackUrl : `/${locale}/account`)
  }

  const flash = sp.verified === '1' ? 'verified' : sp.reset === '1' ? 'reset' : undefined

  return <AuthFlow flash={flash} callbackUrl={callbackUrl} />
}
