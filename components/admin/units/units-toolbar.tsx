'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Download, Plus, Tag } from 'lucide-react'
import { addUnit, exportUnitsCsv, generateBatch } from '@/app/admin/(app)/units/actions'
import type { BoardVariant, MintedUnit } from '@/lib/admin/units'
import { Button } from '@/components/admin/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/admin/ui/dialog'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const today = () => new Date().toISOString().slice(0, 10)

export function UnitsToolbar({
  boardVariants,
  mintedUnits,
}: {
  boardVariants: BoardVariant[]
  mintedUnits: MintedUnit[]
}) {
  const [pending, startTransition] = useTransition()

  // ── Batch ──
  const [batchOpen, setBatchOpen] = useState(false)
  const [qty, setQty] = useState('25')
  const runBatch = () => {
    startTransition(async () => {
      const res = await generateBatch(Number(qty))
      if (res.ok) {
        const csv = ['token,url', ...res.units.map((u) => `${u.token},${u.url}`)].join('\n')
        download(`tk-id-lot-${today()}.csv`, csv)
        toast.success(`${res.units.length} tokens générés — CSV téléchargé.`)
        setBatchOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  // ── Add one board ──
  const [addOpen, setAddOpen] = useState(false)
  const [tokenMode, setTokenMode] = useState<'new' | 'existing'>('new')
  const [existingUnitId, setExistingUnitId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [serial, setSerial] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const runAdd = () => {
    setAddError(null)
    startTransition(async () => {
      const res = await addUnit({ tokenMode, existingUnitId, variantId, serial })
      if (res.ok) {
        toast.success('Planche ajoutée.')
        setAddOpen(false)
        setVariantId('')
        setSerial('')
        setExistingUnitId('')
        setTokenMode('new')
      } else {
        setAddError(res.error)
      }
    })
  }

  const runExport = () => {
    startTransition(async () => {
      const csv = await exportUnitsCsv()
      download(`tk-id-registre-${today()}.csv`, csv)
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Batch */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Tag className="size-4" /> Générer un lot
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Générer un lot de tokens NFC</DialogTitle>
            <DialogDescription>
              Crée des tokens « à assigner » et télécharge le CSV (token + URL) pour encoder les
              tags. Tu assigneras les planches ensuite.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="qty">Quantité</Label>
            <Input
              id="qty"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputMode="numeric"
              className="w-32"
            />
          </div>
          <DialogFooter>
            <Button onClick={runBatch} disabled={pending}>
              {pending ? 'Génération…' : 'Générer + télécharger CSV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add one */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="size-4" /> Ajouter une planche
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une planche</DialogTitle>
            <DialogDescription>Associe un token à une variante de board + sa série.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Token</Label>
              <Select value={tokenMode} onValueChange={(v) => setTokenMode(v as 'new' | 'existing')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Générer un nouveau token</SelectItem>
                  <SelectItem value="existing" disabled={mintedUnits.length === 0}>
                    Utiliser un token existant ({mintedUnits.length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tokenMode === 'existing' && (
              <div className="grid gap-2">
                <Label>Token à assigner</Label>
                <Select value={existingUnitId} onValueChange={setExistingUnitId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un token…" />
                  </SelectTrigger>
                  <SelectContent>
                    {mintedUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="font-mono">
                        {u.token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Variante (board)</Label>
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une variante…" />
                </SelectTrigger>
                <SelectContent>
                  {boardVariants.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucune variante de board
                    </SelectItem>
                  ) : (
                    boardVariants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.productName} · {v.sku}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serial">Numéro de série</Label>
              <Input
                id="serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="SN-…"
                className="font-mono"
              />
            </div>

            {addError && <p className="text-destructive text-sm">{addError}</p>}
          </div>
          <DialogFooter>
            <Button onClick={runAdd} disabled={pending}>
              {pending ? 'Enregistrement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" onClick={runExport} disabled={pending}>
        <Download className="size-4" /> Exporter CSV
      </Button>
    </div>
  )
}
