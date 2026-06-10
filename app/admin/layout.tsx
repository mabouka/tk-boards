import './admin.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TK Admin',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground antialiased">{children}</div>
}
