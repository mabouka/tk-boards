import ResetPasswordForm from '../ResetPasswordForm'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const token = typeof sp.token === 'string' ? sp.token : ''
  return <ResetPasswordForm locale={locale} token={token} />
}
