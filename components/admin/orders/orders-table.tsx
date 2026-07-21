'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { fmtDate } from '@/lib/admin/format'
import { formatEur } from '@/lib/format-price'
import type { AdminOrderRow } from '@/lib/admin/orders'
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
import { ORDER_STATUS_KEYS, orderStatusOf, PAYMENT_LABEL } from './status'

export function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const needle = q.trim().toLowerCase()
  const shown = orders.filter(
    (o) =>
      (statusFilter === 'all' || o.status === statusFilter) &&
      (needle === '' ||
        o.number.toLowerCase().includes(needle) ||
        o.customer.toLowerCase().includes(needle) ||
        o.email.toLowerCase().includes(needle))
  )

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
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commande</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
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
              shown.map((o) => {
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
