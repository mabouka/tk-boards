import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import styles from '../account.module.css'

export default async function AccountDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The layout guarantees a session, but stay null-safe for TS.
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, full_name')
    .eq('id', user?.id ?? '')
    .maybeSingle()

  const t = await getTranslations('account')
  const name = profile?.first_name || profile?.full_name || user?.email || ''

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>{t('welcome', { name })}</h1>
      <p className={styles.intro}>{t('dashboard_intro')}</p>
      <dl className={styles.meta}>
        <div>
          <dt>{t('email_label')}</dt>
          <dd>{user?.email}</dd>
        </div>
      </dl>
    </section>
  )
}
