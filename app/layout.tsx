import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TK Boards — Handcrafted Strapless Kitesurf Boards',
  description: 'TK develops handcrafted strapless boards built around precision. Shaped in Tarifa, Spain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
