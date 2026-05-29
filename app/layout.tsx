import type { Metadata } from 'next'
import { Space_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TK Boards — Handcrafted Strapless Kitesurf Boards',
  description: 'TK develops handcrafted strapless boards built around precision. Shaped in Tarifa, Spain.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${spaceMono.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}
