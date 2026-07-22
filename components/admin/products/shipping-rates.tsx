'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { saveShippingRates } from '@/app/admin/(app)/products/shipping-actions'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card'

type Rate = { country: string; amountEur: string }

type Props = {
  productId: string
  initial: Rate[]
  countries: { code: string; name: string }[]
}

export function ShippingRates({ productId, initial, countries }: Props) {
  const router = useRouter()
  const [rows, setRows] = useState<Rate[]>(initial)
  const [pending, start] = useTransition()

  const setRow = (i: number, patch: Partial<Rate>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const addRow = () => setRows((rs) => [...rs, { country: '', amountEur: '' }])
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i))

  function save() {
    for (const r of rows) {
      if (!r.country) return toast.error('Choisis un pays pour chaque ligne.')
      const n = Number(r.amountEur)
      if (!Number.isFinite(n) || n < 0) return toast.error('Montant invalide.')
    }
    const codes = rows.map((r) => r.country)
    if (new Set(codes).size !== codes.length) return toast.error('Un pays est en double.')

    start(async () => {
      const res = await saveShippingRates(productId, rows)
      if (res.ok) {
        toast.success('Frais de livraison enregistrés.')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frais de livraison</CardTitle>
        <CardDescription>
          Un tarif par pays de destination. Un pays non listé n’est pas livrable pour ce produit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rows.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Aucun pays — ce produit n’est livrable nulle part.
          </p>
        )}

        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={r.country}
              onChange={(e) => setRow(i, { country: e.target.value })}
              className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm"
            >
              <option value="">Pays…</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <div className="relative w-32 shrink-0">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={r.amountEur}
                onChange={(e) => setRow(i, { amountEur: e.target.value })}
                placeholder="0.00"
                className="pr-7 text-right"
              />
              <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm">
                €
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-muted-foreground hover:text-destructive shrink-0"
              aria-label="Retirer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="size-4" /> Ajouter un pays
          </Button>
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
