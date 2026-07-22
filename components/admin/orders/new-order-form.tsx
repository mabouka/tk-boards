'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createManualOrder } from '@/app/admin/(app)/orders/actions'
import type { PickVariant } from '@/lib/admin/orders'
import { formatEur } from '@/lib/format-price'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import { Checkbox } from '@/components/admin/ui/checkbox'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'

type Account = { id: string; name: string; email: string; locale: string }
type Line = { variantId: string; qty: number }

const EUR = (n: number) => formatEur(n, 'fr')
const LANGS = [
  { v: 'fr', label: 'Français' },
  { v: 'en', label: 'English' },
  { v: 'es', label: 'Español' },
]

export function NewOrderForm({ accounts, variants }: { accounts: Account[]; variants: PickVariant[] }) {
  const router = useRouter()
  const vById = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants])

  const [userId, setUserId] = useState('')
  const [locale, setLocale] = useState('fr')
  const [method, setMethod] = useState<'cash' | 'transfer'>('transfer')
  const [paid, setPaid] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [pickVariant, setPickVariant] = useState('')
  const [pickQty, setPickQty] = useState('1')
  const [taxEur, setTaxEur] = useState('0')
  const [shippingEur, setShippingEur] = useState('0')
  const [ship, setShip] = useState({
    name: '',
    line1: '',
    line2: '',
    postalCode: '',
    city: '',
    country: '',
    phone: '',
  })
  const [pending, startTransition] = useTransition()

  const setShipField = (k: keyof typeof ship, v: string) => setShip((s) => ({ ...s, [k]: v }))

  // Picking an account defaults the order language to that account's locale — the
  // admin can still override it below.
  function chooseAccount(id: string) {
    setUserId(id)
    const a = accounts.find((x) => x.id === id)
    if (a) setLocale(a.locale)
  }

  function addLine() {
    if (!pickVariant) return
    const qty = Math.max(1, Math.floor(Number(pickQty) || 1))
    setLines((ls) => [...ls, { variantId: pickVariant, qty }])
    setPickVariant('')
    setPickQty('1')
  }

  const subtotal = lines.reduce((s, l) => s + Number(vById.get(l.variantId)?.priceEur ?? 0) * l.qty, 0)
  const total = subtotal + (Number(taxEur) || 0) + (Number(shippingEur) || 0)
  const canSubmit = userId !== '' && lines.length > 0 && ship.line1.trim() !== '' && !pending

  function submit() {
    startTransition(async () => {
      const res = await createManualOrder({ userId, locale, paymentMethod: method, paid, taxEur, shippingEur, ship, lines })
      if (res.ok) {
        toast.success('Commande créée.')
        router.push(`/admin/orders/${res.id}`)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Select value={userId} onValueChange={chooseAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un compte existant…" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} · {a.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div>
              <Label className="mb-1.5">Langue de la commande</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => (
                    <SelectItem key={l.v} value={l.v}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1.5 text-xs">
                Langue des emails (confirmation, expédition, etc.).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-52">
                <Label className="mb-1.5">Variant</Label>
                <Select value={pickVariant} onValueChange={setPickVariant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un produit…" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label} · {EUR(Number(v.priceEur))} · stock {v.stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label className="mb-1.5">Qté</Label>
                <Input
                  type="number"
                  min={1}
                  value={pickQty}
                  onChange={(e) => setPickQty(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" onClick={addLine} disabled={!pickVariant}>
                Ajouter
              </Button>
            </div>

            {lines.length > 0 && (
              <ul className="flex flex-col gap-2">
                {lines.map((l, i) => {
                  const v = vById.get(l.variantId)
                  return (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        {l.qty}× {v?.label ?? l.variantId}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums">{EUR(Number(v?.priceEur ?? 0) * l.qty)}</span>
                        <button
                          type="button"
                          onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Retirer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adresse de livraison</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Field label="Nom" value={ship.name} onChange={(v) => setShipField('name', v)} />
            <Field label="Téléphone" value={ship.phone} onChange={(v) => setShipField('phone', v)} />
            <div className="sm:col-span-2">
              <Field label="Adresse *" value={ship.line1} onChange={(v) => setShipField('line1', v)} />
            </div>
            <div className="sm:col-span-2">
              <Field label="Complément" value={ship.line2} onChange={(v) => setShipField('line2', v)} />
            </div>
            <Field label="Code postal" value={ship.postalCode} onChange={(v) => setShipField('postalCode', v)} />
            <Field label="Ville" value={ship.city} onChange={(v) => setShipField('city', v)} />
            <Field label="Pays" value={ship.country} onChange={(v) => setShipField('country', v)} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Paiement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Label className="mb-1.5">Moyen</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as 'cash' | 'transfer')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="cash">Espèces</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={paid} onCheckedChange={(v) => setPaid(v === true)} />
              Déjà payée
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sous-total</span>
              <span className="tabular-nums">{EUR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span>TVA</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={taxEur}
                onChange={(e) => setTaxEur(e.target.value)}
                className="h-8 w-24 text-right"
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span>Livraison</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={shippingEur}
                onChange={(e) => setShippingEur(e.target.value)}
                className="h-8 w-24 text-right"
              />
            </div>
            <div className="text-foreground flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{EUR(total)}</span>
            </div>
          </CardContent>
        </Card>

        <Button onClick={submit} disabled={!canSubmit}>
          Créer la commande
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
