import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'
import styles from './account.module.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Security boundary: never render the member area without a session.
  if (!user) redirect(`/${locale}/login`)

  // Onboarding gate: send not-yet-onboarded accounts to complete their profile.
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle()
  if (profile && !profile.onboarded) redirect(`/${locale}/onboarding`)

  const t = await getTranslations('account')

  return (
    <div className={styles.shell}>
      <header className={styles.bar}>
        <Link href={`/${locale}`} className={styles.brand}>
          TK Boards
        </Link>
        <nav className={styles.nav}>
          <Link href={`/${locale}/account`}>{t('nav_dashboard')}</Link>
          <Link href={`/${locale}/account/boards`}>{t('nav_boards')}</Link>
          <Link href={`/${locale}/account/claims`}>{t('nav_claims')}</Link>
        </nav>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <button className={styles.signout} type="submit">
            {t('sign_out')}
          </button>
        </form>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
