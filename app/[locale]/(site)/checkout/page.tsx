import { redirect } from 'next/navigation'
import { eshopVisible } from '@/lib/eshop'
import CheckoutClient from '@/components/commerce/checkout/CheckoutClient'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ buy?: string }>
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale } = await params
  // No checkout when the shop is off — send a stray/bookmarked visitor home.
  if (!(await eshopVisible())) redirect(`/${locale}`)
  const { buy } = await searchParams
  return <CheckoutClient locale={locale} buy={buy ?? null} />
}
