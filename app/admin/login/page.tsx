import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { auth, signOut } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { Button } from '@/components/admin/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card'
import { LoginForm } from '@/components/admin/login-form'

export default async function AdminLoginPage() {
  const session = await auth()
  let role: string | null = null

  if (session?.user?.id) {
    const [u] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)
    role = u?.role ?? null
    if (role === 'admin') redirect('/admin')
  }

  const deniedAccess = role !== null && role !== 'admin'

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            TK <span className="text-muted-foreground font-normal">Admin</span>
          </CardTitle>
          <CardDescription>
            {deniedAccess
              ? "Ce compte n'a pas accès à l'administration."
              : 'Connecte-toi pour accéder au tableau de bord.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deniedAccess ? (
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/admin/login' })
              }}
            >
              <Button type="submit" variant="outline" className="w-full">
                Se déconnecter
              </Button>
            </form>
          ) : (
            <LoginForm />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
