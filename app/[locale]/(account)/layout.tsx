import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { signOut } from './actions'
import styles from './account.module.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params

  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  // Reject stale sessions (a password reset / logout-everywhere bumped the version).
  const [u] = await db
    .select({ tokenVersion: users.tokenVersion })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)
  if (!u || (u.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) {
    redirect(`/${locale}/login`)
  }

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
