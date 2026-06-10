'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateAccount } from '@/app/admin/(app)/accounts/actions'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d) : '—'

type Account = {
  id: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  locale: string
  email: string
  method: 'password' | 'google'
  emailVerified: Date | null
  createdAt: Date
}

export function AccountInfoForm({ account }: { account: Account }) {
  const [firstName, setFirstName] = useState(account.firstName ?? '')
  const [lastName, setLastName] = useState(account.lastName ?? '')
  const [phone, setPhone] = useState(account.phone ?? '')
  const [locale, setLocale] = useState(account.locale)
  const [pending, start] = useTransition()

  function save() {
    start(async () => {
      const res = await updateAccount(account.id, { firstName, lastName, phone, locale })
      if (res.ok) toast.success('Compte mis à jour.')
      else toast.error(res.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compte</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fn">Prénom</Label>
            <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ln">Nom</Label>
            <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ph">Téléphone</Label>
          <Input
            id="ph"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33…"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Langue</Label>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <dl className="flex flex-col gap-2 border-t pt-3 text-sm">
          <Row k="Email" v={account.email} />
          <Row k="Méthode" v={account.method === 'password' ? 'Mot de passe' : 'Google'} />
          <Row k="Email vérifié" v={account.emailVerified ? fmtDate(account.emailVerified) : 'Non'} />
          <Row k="Inscrit le" v={fmtDate(account.createdAt)} />
        </dl>

        <Button onClick={save} disabled={pending} className="self-start">
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  )
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  )
}
