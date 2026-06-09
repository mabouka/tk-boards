'use client'

import { useActionState } from 'react'
import { adminLogin, adminGoogle, type LoginState } from '@/app/admin/login/actions'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(adminLogin, null)

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
      <div className="relative text-center text-xs text-muted-foreground">
        <span className="bg-card relative z-10 px-2">ou</span>
        <span className="bg-border absolute inset-x-0 top-1/2 h-px" />
      </div>
      <form action={adminGoogle}>
        <Button type="submit" variant="outline" className="w-full">
          Continuer avec Google
        </Button>
      </form>
    </div>
  )
}
