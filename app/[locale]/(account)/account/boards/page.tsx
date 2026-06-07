import { getTranslations } from 'next-intl/server'
import styles from '../../account.module.css'

export default async function AccountBoards() {
  const t = await getTranslations('account')

  return (
    <section className={styles.dashboard}>
      <h1 className={styles.title}>{t('boards_title')}</h1>
      <p className={styles.intro}>{t('boards_empty')}</p>
      <p className={styles.soon}>{t('soon')}</p>
    </section>
  )
}
