'use client'

import { useState, useTransition } from 'react'
import { fmtDate } from '@/lib/admin/format'
import { toast } from 'sonner'
import { Check, Copy, Search } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { updateUnit } from '@/app/admin/(app)/units/actions'
import type { BoardVariant, UnitRow } from '@/lib/admin/units'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/admin/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  minted: { label: 'À assigner', variant: 'secondary' },
  provisioned: { label: 'Prête', variant: 'default' },
  registered: { label: 'Enregistrée', variant: 'outline' },
  stolen: { label: 'Perdue / volée', variant: 'destructive' },
  transferred: { label: 'Transférée', variant: 'outline' },
}

// Public TK ID URL the NFC tag points to. NEXT_PUBLIC_SITE_URL is inlined at build;
// fall back to the current origin (admin + site share the domain).
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? ''
const tagUrlFor = (token: string) =>
  `${SITE || (typeof window !== 'undefined' ? window.location.origin : '')}/tk-id/${token}`

export function UnitsTable({
  units,
  boardVariants,
}: {
  units: UnitRow[]
  boardVariants: BoardVariant[]
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [pending, startTransition] = useTransition()

  // Edit / assign dialog state
  const [editing, setEditing] = useState<UnitRow | null>(null)
  const [variantId, setVariantId] = useState('')
  const [serial, setSerial] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const needle = q.trim().toLowerCase()
  const shown = units.filter(
    (u) =>
      (filter === 'all' || u.status === filter) &&
      (needle === '' ||
        u.token.toLowerCase().includes(needle) ||
        (u.serial ?? '').toLowerCase().includes(needle) ||
        (u.productName ?? '').toLowerCase().includes(needle))
  )

  const copy = (token: string) => {
    navigator.clipboard?.writeText(token)
    toast.success('Token copié.')
  }

  const openEdit = (u: UnitRow) => {
    setEditing(u)
    setVariantId(u.variantId ?? '')
    setSerial(u.serial ?? '')
    setErr(null)
  }

  const submit = () => {
    if (!editing) return
    setErr(null)
    startTransition(async () => {
      const res = await updateUnit(editing.id, variantId, serial)
      if (res.ok) {
        toast.success(editing.status === 'minted' ? 'Planche assignée.' : 'Unité mise à jour.')
        setEditing(null)
        setVariantId('')
        setSerial('')
      } else {
        setErr(res.error)
      }
    })
  }

  const isAssign = editing?.status === 'minted'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Token, série ou produit…"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="minted">À assigner</SelectItem>
            <SelectItem value="provisioned">Prêtes</SelectItem>
            <SelectItem value="registered">Enregistrées</SelectItem>
            <SelectItem value="stolen">Perdues / volées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Board</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                  Aucune unité.
                </TableCell>
              </TableRow>
            ) : (
              shown.map((u) => {
                const s = STATUS[u.status] ?? { label: u.status, variant: 'outline' as const }
                return (
                  <TableRow key={u.id} onClick={() => openEdit(u)} className="cursor-pointer">
                    <TableCell>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          copy(u.token)
                        }}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 font-mono text-xs"
                        title="Copier le token"
                      >
                        {u.token.slice(0, 12)}…
                        <Copy className="size-3" />
                      </button>
                    </TableCell>
                    <TableCell>
                      {u.productName ? (
                        <span>
                          {u.productName}{' '}
                          <span className="text-muted-foreground font-mono text-xs">{u.variantSku}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.serial ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{fmtDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEdit(u)
                        }}
                      >
                        {u.status === 'minted' ? 'Assigner' : 'Éditer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAssign ? 'Assigner la planche' : 'Modifier l’unité'}</DialogTitle>
            <DialogDescription>
              Token <span className="font-mono">{editing?.token.slice(0, 12)}…</span> → variante de
              board + numéro de série.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Variante (board)</Label>
              <Select value={variantId} onValueChange={setVariantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une variante…" />
                </SelectTrigger>
                <SelectContent>
                  {boardVariants.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.productName} · {v.sku}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-serial">Numéro de série</Label>
              <Input
                id="edit-serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="SN-…"
                className="font-mono"
              />
            </div>
            {err && <p className="text-destructive text-sm">{err}</p>}

            {editing && (
              <div className="flex flex-col items-center gap-2 rounded-md border p-4">
                <span className="text-muted-foreground text-xs">URL publique (TK ID)</span>
                <div className="rounded bg-white p-2">
                  <QRCodeSVG value={tagUrlFor(editing.token)} size={148} />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(tagUrlFor(editing.token))
                    toast.success('URL copiée.')
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs break-all"
                  title="Copier l’URL"
                >
                  {tagUrlFor(editing.token)}
                  <Copy className="size-3 shrink-0" />
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={pending}>
              <Check className="size-4" />{' '}
              {pending ? 'Enregistrement…' : isAssign ? 'Assigner' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
