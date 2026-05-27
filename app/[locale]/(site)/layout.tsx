import Header from '@/components/header/Header'
import Footer from '@/components/footer/Footer'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function SiteLayout({ children, params }: Props) {
  const { locale } = await params

  return (
    <>
      <Header locale={locale} />
      <main>{children}</main>
      <Footer locale={locale} />
    </>
  )
}
