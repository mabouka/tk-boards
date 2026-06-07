import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AuthFlow from '../AuthFlow'

type Props = { params: Promise<{ locale: string }> }

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
