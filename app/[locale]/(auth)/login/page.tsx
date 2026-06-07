import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { buildMetadata } from '@/lib/metadata'
import { client } from '@/sanity/lib/client'
import { authPageQuery } from '@/sanity/lib/queries'
import AuthFlow from '../AuthFlow'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const [authContent, t] = await Promise.all([
    client.fetch(authPageQuery, { locale }),
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

export default async function LoginPage({ params }: Props) {
  const { locale } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already signed in → skip the form.
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', user.id)
      .maybeSingle()
    redirect(profile?.onboarded ? `/${locale}/account` : `/${locale}/onboarding`)
  }

  return <AuthFlow />
}
