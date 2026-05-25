import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <main>
      <p>{t('hero_cta')}</p>
    </main>
  )
}
