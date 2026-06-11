import BigTitle from '@/components/placeholder/BigTitle'

// Accessories is a product type managed in the Studio (like Boards), not a CMS
// page. Dedicated route — placeholder for now, to become a real listing later.
const TITLES: Record<string, string> = { fr: 'Accessoires', en: 'Accessories', es: 'Accesorios' }

type Props = { params: Promise<{ locale: string }> }

export default async function AccessoriesPage({ params }: Props) {
  const { locale } = await params
  return <BigTitle>{TITLES[locale] ?? 'Accessories'}</BigTitle>
}
