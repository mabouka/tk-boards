'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from 'lucide-react'
import { fmtDate } from '@/lib/admin/format'
import { formatEur } from '@/lib/format-price'
import { buildCsv } from '@/lib/csv'
import { downloadTextFile } from '@/lib/download'
import type { AdminOrderRow } from '@/lib/admin/orders'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
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
import { ORDER_STATUS_KEYS, orderStatusOf, PAYMENT_LABEL } from './status'

type SortKey = 'date' | 'total'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown className="text-muted-foreground size-3.5" />
  return dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
}

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sort, setSort] = useState<Sort>({ key: 'date', dir: 'desc' })

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  const needle = q.trim().toLowerCase()
  const shown = orders.filter(
    (o) =>
      (statusFilter === 'all' || o.status === statusFilter) &&
      (needle === '' ||
        o.number.toLowerCase().includes(needle) ||
        o.customer.toLowerCase().includes(needle) ||
        o.email.toLowerCase().includes(needle))
  )

  const dir = sort.dir === 'asc' ? 1 : -1
  const sorted = [...shown].sort((a, b) =>
    sort.key === 'total'
      ? (Number(a.totalEur) - Number(b.totalEur)) * dir
      : (a.createdAt.getTime() - b.createdAt.getTime()) * dir
  )

  // Export exactly what's on screen (current search + status filter), built from
  // the already-loaded rows — so "export" matches the view, not the whole table.
  const exportCsv = () => {
    const csv = buildCsv(
      ['number', 'date', 'customer', 'email', 'items', 'payment_method', 'payment_status', 'status', 'total_eur'],
      sorted.map((o) => [
        o.number,
        o.createdAt.toISOString(),
        o.customer,
        o.email,
        o.itemCount,
        o.paymentMethod,
        o.paymentStatus,
        o.status,
        o.totalEur,
      ])
    )
    downloadTextFile(`commandes-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="N°, client, email…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {ORDER_STATUS_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {orderStatusOf(k).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={exportCsv}
          disabled={shown.length === 0}
        >
          <Download className="size-4" /> Exporter ({shown.length})
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('total')}
                  className="hover:text-foreground ml-auto inline-flex items-center gap-1"
                >
                  Total <SortIcon active={sort.key === 'total'} dir={sort.dir} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className="hover:text-foreground inline-flex items-center gap-1"
                >
                  Date <SortIcon active={sort.key === 'date'} dir={sort.dir} />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  Aucune commande.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((o) => {
                const st = orderStatusOf(o.status)
                return (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm hover:underline">
                        #{o.number}
                      </Link>
                      <div className="text-muted-foreground text-xs">{o.itemCount} art.</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{o.customer}</div>
                      <div className="text-muted-foreground text-xs">{o.email}</div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                      {o.paymentStatus !== 'paid' && (
                        <Badge variant="secondary" className="ml-2">
                          Non payé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEur(Number(o.totalEur), 'fr')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{fmtDate(o.createdAt)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
