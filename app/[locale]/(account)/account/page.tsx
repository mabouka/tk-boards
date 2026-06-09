import { getTranslations } from 'next-intl/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import styles from '../account.module.css'

export default async function AccountDashboard() {
  const session = await auth()
  const t = await getTranslations('account')

  let name = session?.user?.email ?? ''
  let email = session?.user?.email ?? ''

  if (session?.user?.id) {
    const [u] = await db
      .select({ firstName: users.firstName, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
    if (u) {
      name = u.firstName || u.name || u.email
      email = u.email
    }
  }

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>{t('welcome', { name })}</h1>
      <p className={styles.intro}>{t('dashboard_intro')}</p>
      <dl className={styles.meta}>
        <div>
          <dt>{t('email_label')}</dt>
          <dd>{email}</dd>
        </div>
      </dl>
    </section>
  )
}
