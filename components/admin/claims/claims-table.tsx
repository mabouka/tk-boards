'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { setClaimStatus, type ClaimStatus } from '@/app/admin/(app)/claims/actions'
import type { ClaimRow } from '@/lib/admin/claims'
import { Badge } from '@/components/admin/ui/badge'
import { Card } from '@/components/admin/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'

const STATUS: Record<ClaimStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  open: { label: 'Ouverte', variant: 'default' },
  in_review: { label: 'En cours', variant: 'secondary' },
  resolved: { label: 'Résolue', variant: 'outline' },
  rejected: { label: 'Rejetée', variant: 'destructive' },
}
const STATUS_KEYS = Object.keys(STATUS) as ClaimStatus[]

const fmtDate = (d: Date) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d)
const statusOf = (s: string) => STATUS[s as ClaimStatus] ?? { label: s, variant: 'default' as const }

type StatusFilter = 'all' | ClaimStatus

export function ClaimsTable({ claims }: { claims: ClaimRow[] }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selected, setSelected] = useState<ClaimRow | null>(null)
  const [status, setStatus] = useState<ClaimStatus>('open')
  const [pending, startTransition] = useTransition()

  const needle = q.trim().toLowerCase()
  const shown = claims.filter(
    (c) =>
      (statusFilter === 'all' || c.status === statusFilter) &&
      (needle === '' ||
        c.ownerName.toLowerCase().includes(needle) ||
        c.ownerEmail.toLowerCase().includes(needle) ||
        (c.productName ?? '').toLowerCase().includes(needle) ||
        (c.sku ?? '').toLowerCase().includes(needle))
  )

  function open(c: ClaimRow) {
    setSelected(c)
    setStatus(c.status as ClaimStatus)
  }

  function changeStatus(next: ClaimStatus) {
    if (!selected) return
    const prev = status
    setStatus(next) // optimistic
    startTransition(async () => {
      const res = await setClaimStatus(selected.id, next)
      if (res.ok) toast.success('Statut mis à jour.')
      else {
        setStatus(prev)
        toast.error(res.error)
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
            placeholder="Rechercher client, produit ou SKU…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {STATUS_KEYS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Board</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-28">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                  Aucune réclamation.
                </TableCell>
              </TableRow>
            ) : (
              shown.map((c) => (
                <TableRow key={c.id} onClick={() => open(c)} className="cursor-pointer">
                  <TableCell>
                    <div className="font-medium">{c.ownerName}</div>
                    <div className="text-muted-foreground truncate text-xs">{c.ownerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <div>{c.productName ?? '—'}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {[c.sku, c.serial].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-muted-foreground line-clamp-2 text-sm">
                      {c.description || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {fmtDate(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusOf(c.status).variant}>{statusOf(c.status).label}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réclamation</DialogTitle>
            <DialogDescription>
              {selected && `Ouverte le ${fmtDate(selected.createdAt)}`}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col gap-4 text-sm">
              <Field label="Client">
                <Link
                  href={`/admin/accounts/${selected.ownerId}`}
                  className="font-medium hover:underline"
                >
                  {selected.ownerName}
                </Link>
                <div className="text-muted-foreground text-xs">{selected.ownerEmail}</div>
              </Field>
              <Field label="Board">
                <div>{selected.productName ?? '—'}</div>
                <div className="text-muted-foreground font-mono text-xs">
                  {[selected.sku, selected.serial].filter(Boolean).join(' · ') || '—'}
                </div>
              </Field>
              <Field label="Description">
                <p className="whitespace-pre-wrap">{selected.description || '—'}</p>
              </Field>
              {selected.photoCount > 0 && (
                <Field label="Photos">
                  {selected.photoCount} photo{selected.photoCount > 1 ? 's' : ''} jointe
                  {selected.photoCount > 1 ? 's' : ''}
                </Field>
              )}
              <div className="grid gap-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v) => changeStatus(v as ClaimStatus)} disabled={pending}>
                  <SelectTrigger className="w-48">
                    <SelectValue>
                      <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_KEYS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b pb-3 last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      {children}
    </div>
  )
}
