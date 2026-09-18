'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { ProductListRow } from '@/lib/admin/products'
import { Badge } from '@/components/admin/ui/badge'
import { Card } from '@/components/admin/ui/card'
import { Input } from '@/components/admin/ui/input'
import { useSort, SortHeader } from '@/components/admin/ui/sortable'
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

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

function priceLabel(min: number | null, max: number | null) {
  if (min == null) return '—'
  const hi = max ?? min
  return min === hi ? eur(min) : `${eur(min)} – ${eur(hi)}`
}

const KIND_LABEL: Record<string, string> = { board: 'Board', accessory: 'Accessoire' }

export function ProductsTable({ rows }: { rows: ProductListRow[] }) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')

  const needle = q.trim().toLowerCase()
  const shown = rows.filter(
    (p) =>
      (kind === 'all' || p.kind === kind) &&
      (status === 'all' || (status === 'active' ? p.active : !p.active)) &&
      (needle === '' ||
        p.name.toLowerCase().includes(needle) ||
        p.sku.toLowerCase().includes(needle))
  )

  const { sorted, sort, toggle } = useSort(
    shown,
    {
      name: (a, b) => a.name.localeCompare(b.name),
      variants: (a, b) => a.variantCount - b.variantCount,
      price: (a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0),
    },
    { key: 'name', dir: 'asc' }
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom ou SKU…"
            className="pl-9"
          />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="board">Boards</SelectItem>
            <SelectItem value="accessory">Accessoires</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortHeader label="Nom" sortKey="name" sort={sort} onToggle={toggle} />
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>
                <SortHeader label="Variantes" sortKey="variants" sort={sort} onToggle={toggle} />
              </TableHead>
              <TableHead>
                <SortHeader label="Prix" sortKey="price" sort={sort} onToggle={toggle} />
              </TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center text-sm">
                  Aucun produit.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {p.sku}
                    </Link>
                  </TableCell>
                  <TableCell>{p.kind ? (KIND_LABEL[p.kind] ?? p.kind) : '—'}</TableCell>
                  <TableCell>{p.variantCount}</TableCell>
                  <TableCell>{priceLabel(p.priceMin, p.priceMax)}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? 'default' : 'secondary'}>
                      {p.active ? 'Actif' : 'Brouillon'}
                    </Badge>
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
