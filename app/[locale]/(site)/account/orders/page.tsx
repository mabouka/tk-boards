import { getTranslations } from 'next-intl/server'
import styles from '../account.module.css'

export default async function MyOrdersPage() {
  const t = await getTranslations('account')
  return (
    <div className={styles.empty}>
      <p>{t('soon')}</p>
    </div>
  )
}
