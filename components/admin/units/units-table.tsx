'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Search } from 'lucide-react'
import { assignUnit } from '@/app/admin/(app)/units/actions'
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
  stolen: { label: 'Volée', variant: 'destructive' },
  transferred: { label: 'Transférée', variant: 'outline' },
}

const fmtDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d)

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

  // Assign dialog state
  const [assigning, setAssigning] = useState<UnitRow | null>(null)
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

  const submitAssign = () => {
    if (!assigning) return
    setErr(null)
    startTransition(async () => {
      const res = await assignUnit(assigning.id, variantId, serial)
      if (res.ok) {
        toast.success('Planche assignée.')
        setAssigning(null)
        setVariantId('')
        setSerial('')
      } else {
        setErr(res.error)
      }
    })
  }

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
            <SelectItem value="stolen">Volées</SelectItem>
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
                  <TableRow key={u.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => copy(u.token)}
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
                      {u.status === 'minted' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAssigning(u)
                            setErr(null)
                          }}
                        >
                          Assigner
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={assigning !== null} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner la planche</DialogTitle>
            <DialogDescription>
              Token <span className="font-mono">{assigning?.token.slice(0, 12)}…</span> → variante de
              board + série.
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
              <Label htmlFor="assign-serial">Numéro de série</Label>
              <Input
                id="assign-serial"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="SN-…"
                className="font-mono"
              />
            </div>
            {err && <p className="text-destructive text-sm">{err}</p>}
          </div>
          <DialogFooter>
            <Button onClick={submitAssign} disabled={pending}>
              <Check className="size-4" /> {pending ? 'Assignation…' : 'Assigner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
