'use client'

import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { setClaimStatus, type ClaimStatus } from '@/app/admin/(app)/claims/actions'
import type { ClaimRow } from '@/lib/admin/claims'
import { Badge } from '@/components/admin/ui/badge'
import { Card } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
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

type StatusFilter = 'all' | ClaimStatus

export function ClaimsTable({ claims }: { claims: ClaimRow[] }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
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

  function changeStatus(id: string, status: ClaimStatus) {
    startTransition(async () => {
      const res = await setClaimStatus(id, status)
      if (res.ok) toast.success('Statut mis à jour.')
      else toast.error(res.error)
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
              <TableHead className="w-44">Statut</TableHead>
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
                <TableRow key={c.id}>
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
                    {c.photoCount > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {c.photoCount} photo{c.photoCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {fmtDate(c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={c.status}
                      onValueChange={(v) => changeStatus(c.id, v as ClaimStatus)}
                      disabled={pending}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue>
                          <Badge variant={STATUS[c.status as ClaimStatus]?.variant ?? 'default'}>
                            {STATUS[c.status as ClaimStatus]?.label ?? c.status}
                          </Badge>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
