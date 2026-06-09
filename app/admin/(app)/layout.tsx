import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/admin/ui/sidebar'
import { Separator } from '@/components/admin/ui/separator'
import { Toaster } from '@/components/admin/ui/sonner'
import { Button } from '@/components/admin/ui/button'
import { AppSidebar } from '@/components/admin/app-sidebar'
import { adminSignOut } from './actions'

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/admin/login')

  const [u] = await db
    .select({
      role: users.role,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      tokenVersion: users.tokenVersion,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (u?.role !== 'admin') redirect('/admin/login')
  // Reject stale sessions (a password reset / logout-everywhere bumped the version).
  if ((u.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) redirect('/admin/login')

  const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{displayName}</span>
            <form action={adminSignOut}>
              <Button type="submit" variant="ghost" size="sm">
                Déconnexion
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
