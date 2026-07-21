import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'
import { liveSession } from '@/lib/session'
import { haloProps } from '@/components/ui/halo/haloProps'
import AccountTabs from './AccountTabs'
import styles from './account.module.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Members-only. The site header/footer come from the parent (site) layout; here
// we gate access and render the shared account header (eyebrow + welcome + tabs)
// above every account tab's content.
export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params
  const session = await liveSession()
  if (!session) redirect(`/${locale}/login`)

  const t = await getTranslations('account')
  const [profile] = await db
    .select({ firstName: users.firstName, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)
  const name = profile?.firstName || profile?.name || profile?.email || ''

  return (
    <section className={styles.wrap}>
      <p className={styles.eyebrow}>{t('overline')}</p>
      <h1
        className={styles.title}
        {...haloProps({
          rgb: '225, 225, 255',
          opacity: 0.15,
          w: '67vw',
          h: '30vh',
          spread: '31%',
          anchor: 'top-left',
        })}
      >
        {t('welcome', { name })}
      </h1>
      <AccountTabs locale={locale} />
      {children}
    </section>
  )
}
