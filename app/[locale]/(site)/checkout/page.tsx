import CheckoutClient from '@/components/commerce/checkout/CheckoutClient'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ buy?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { buy } = await searchParams
  return <CheckoutClient locale={locale} buy={buy ?? null} />
}
