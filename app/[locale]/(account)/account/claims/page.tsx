import { getTranslations } from 'next-intl/server'
import styles from '../../account.module.css'

export default async function AccountClaims() {
  const t = await getTranslations('account')

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>{t('claims_title')}</h1>
      <p className={styles.intro}>{t('claims_empty')}</p>
      <p className={styles.soon}>{t('soon')}</p>
    </section>
  )
}
