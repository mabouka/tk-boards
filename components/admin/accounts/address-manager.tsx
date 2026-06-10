'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressInput,
} from '@/app/admin/(app)/accounts/actions'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Checkbox } from '@/components/admin/ui/checkbox'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'

type Address = {
  id: string
  company: string | null
  line1: string
  line2: string | null
  postalCode: string | null
  city: string | null
  country: string | null
  phone: string | null
  isDefault: boolean
}

const EMPTY: AddressInput = {
  company: '',
  line1: '',
  line2: '',
  postalCode: '',
  city: '',
  country: '',
  phone: '',
  isDefault: false,
}

export function AddressManager({ userId, addresses }: { userId: string; addresses: Address[] }) {
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [draft, setDraft] = useState<AddressInput>(EMPTY)
  const [pending, start] = useTransition()

  const patch = (p: Partial<AddressInput>) => setDraft((d) => ({ ...d, ...p }))

  function openNew() {
    setDraft({ ...EMPTY, isDefault: addresses.length === 0 })
    setEditing('new')
  }
  function openEdit(a: Address) {
    setDraft({
      company: a.company ?? '',
      line1: a.line1,
      line2: a.line2 ?? '',
      postalCode: a.postalCode ?? '',
      city: a.city ?? '',
      country: a.country ?? '',
      phone: a.phone ?? '',
      isDefault: a.isDefault,
    })
    setEditing(a.id)
  }

  function save() {
    start(async () => {
      const res =
        editing === 'new'
          ? await addAddress(userId, draft)
          : await updateAddress(editing as string, userId, draft)
      if (res.ok) {
        toast.success('Adresse enregistrée.')
        setEditing(null)
      } else {
        toast.error(res.error)
      }
    })
  }
  function remove(id: string) {
    start(async () => {
      const res = await deleteAddress(id, userId)
      if (res.ok) toast.success('Adresse supprimée.')
      else toast.error(res.error)
    })
  }
  function makeDefault(id: string) {
    start(async () => {
      const res = await setDefaultAddress(id, userId)
      if (!res.ok) toast.error(res.error)
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Adresses</CardTitle>
        {editing === null && (
          <Button size="sm" variant="outline" onClick={openNew}>
            Ajouter
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        {addresses.length === 0 && editing !== 'new' && (
          <p className="text-muted-foreground text-sm">Aucune adresse.</p>
        )}

        {addresses.map((a) =>
          editing === a.id ? (
            <AddressForm
              key={a.id}
              draft={draft}
              patch={patch}
              onSave={save}
              onCancel={() => setEditing(null)}
              pending={pending}
            />
          ) : (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
            >
              <div>
                {a.isDefault && (
                  <Badge variant="outline" className="mb-1">
                    Par défaut
                  </Badge>
                )}
                {a.company && <div className="font-medium">{a.company}</div>}
                <div>{a.line1}</div>
                {a.line2 && <div>{a.line2}</div>}
                <div className="text-muted-foreground">
                  {[a.postalCode, a.city, a.country].filter(Boolean).join(', ') || '—'}
                </div>
                {a.phone && <div className="text-muted-foreground">{a.phone}</div>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {!a.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => makeDefault(a.id)} disabled={pending}>
                    Par défaut
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => openEdit(a)} disabled={pending}>
                  Modifier
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)} disabled={pending}>
                  Supprimer
                </Button>
              </div>
            </div>
          )
        )}

        {editing === 'new' && (
          <AddressForm
            draft={draft}
            patch={patch}
            onSave={save}
            onCancel={() => setEditing(null)}
            pending={pending}
          />
        )}
      </CardContent>
    </Card>
  )
}

function AddressForm({
  draft,
  patch,
  onSave,
  onCancel,
  pending,
}: {
  draft: AddressInput
  patch: (p: Partial<AddressInput>) => void
  onSave: () => void
  onCancel: () => void
  pending: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border p-3">
      <Input
        value={draft.company}
        onChange={(e) => patch({ company: e.target.value })}
        placeholder="Société (optionnel)"
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="a-line1">Adresse</Label>
        <Input
          id="a-line1"
          value={draft.line1}
          onChange={(e) => patch({ line1: e.target.value })}
          placeholder="N° et rue"
        />
      </div>
      <Input
        value={draft.line2}
        onChange={(e) => patch({ line2: e.target.value })}
        placeholder="Complément (optionnel)"
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          value={draft.postalCode}
          onChange={(e) => patch({ postalCode: e.target.value })}
          placeholder="Code postal"
        />
        <Input
          value={draft.city}
          onChange={(e) => patch({ city: e.target.value })}
          placeholder="Ville"
          className="col-span-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          value={draft.country}
          onChange={(e) => patch({ country: e.target.value })}
          placeholder="Pays"
        />
        <Input
          type="tel"
          value={draft.phone}
          onChange={(e) => patch({ phone: e.target.value })}
          placeholder="Téléphone"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={draft.isDefault}
          onCheckedChange={(c) => patch({ isDefault: c === true })}
        />
        Adresse par défaut
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={pending}>
          Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
