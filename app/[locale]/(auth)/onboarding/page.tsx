import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { saveOnboarding, skipOnboarding } from '../actions'
import { PhoneIcon } from '@/components/auth/icons'
import styles from '../auth.module.css'

type Props = { params: Promise<{ locale: string }> }

export default async function OnboardingPage({ params }: Props) {
  const { locale } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const t = await getTranslations('auth')

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{t('onboard_title')}</h1>
      <p className={styles.subtitle}>{t('onboard_sub')}</p>
      <form className={styles.form} action={saveOnboarding}>
        <input type="hidden" name="locale" value={locale} />
        <p className={styles.formLabel}>{t('onboard_address_label')}</p>
        <input className={styles.field} name="line1" type="text" placeholder={t('address')} autoComplete="address-line1" />
        <input className={styles.field} name="line2" type="text" placeholder={t('address2')} autoComplete="address-line2" />
        <div className={styles.row2}>
          <input className={styles.field} name="postal_code" type="text" placeholder={t('postal_code')} autoComplete="postal-code" />
          <input className={styles.field} name="city" type="text" placeholder={t('city')} autoComplete="address-level2" />
        </div>
        <input className={styles.field} name="country" type="text" placeholder={t('country')} autoComplete="country-name" />
        <label className={styles.inputWrap}>
          <PhoneIcon />
          <input className={styles.field} name="phone" type="tel" placeholder={t('phone')} autoComplete="tel" />
        </label>
        <div className={styles.actions}>
          <button className={`u-cta u-cta--white-fill ${styles.btnRow}`} type="submit">
            {t('finish')}
          </button>
          <button className={styles.linklike} type="submit" formAction={skipOnboarding}>
            {t('skip')}
          </button>
        </div>
      </form>
    </div>
  )
}
