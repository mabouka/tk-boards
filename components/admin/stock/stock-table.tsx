'use client'

import { useState, useTransition } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { setStock } from '@/app/admin/(app)/stock/actions'
import type { StockRow } from '@/lib/admin/stock'
import {
  stockStatus,
  clampStock,
  matchesStockFilter,
  matchesStockSearch,
  type StockFilter,
} from '@/lib/admin/stock-ui'
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

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

const TONE = {
  out: { label: 'Rupture', variant: 'destructive' as const },
  low: { label: 'Faible', variant: 'secondary' as const },
  ok: { label: 'OK', variant: 'default' as const },
}

function StockControls({
  variantId,
  initial,
  lowThreshold,
}: {
  variantId: string
  initial: number
  lowThreshold: number
}) {
  const [value, setValue] = useState(initial)
  const [, startTransition] = useTransition()

  const save = (next: number) => {
    const v = clampStock(next)
    setValue(v)
    startTransition(() => setStock(variantId, v))
  }

  const tone = TONE[stockStatus(value, lowThreshold)]

  return (
    <div className="flex items-center justify-end gap-3">
      <Badge variant={tone.variant}>{tone.label}</Badge>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => save(value - 1)}
          disabled={value <= 0}
          aria-label="Retirer une unité"
        >
          <Minus className="size-4" />
        </Button>
        <Input
          value={value}
          onChange={(e) => setValue(Number(e.target.value) || 0)}
          onBlur={() => save(value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          inputMode="numeric"
          className="h-8 w-16 text-center"
          aria-label="Stock"
        />
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => save(value + 1)}
          aria-label="Ajouter une unité"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export function StockTable({ rows, lowThreshold }: { rows: StockRow[]; lowThreshold: number }) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<StockFilter>('all')

  const shown = rows.filter(
    (r) => matchesStockFilter(r.stock, filter, lowThreshold) && matchesStockSearch(r, q)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher produit ou SKU…"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as StockFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout</SelectItem>
            <SelectItem value="low">Stock faible</SelectItem>
            <SelectItem value="out">En rupture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground py-10 text-center text-sm">
                  Aucune variante.
                </TableCell>
              </TableRow>
            ) : (
              shown.map((r) => (
                <TableRow key={r.variantId}>
                  <TableCell className="font-medium">{r.productName}</TableCell>
                  <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{r.kind ?? '—'}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.priceEur == null ? (
                      '—'
                    ) : r.salePriceEur != null ? (
                      <>
                        <span className="text-muted-foreground mr-2 line-through">{eur(r.priceEur)}</span>
                        <span className="font-medium">{eur(r.salePriceEur)}</span>
                      </>
                    ) : (
                      eur(r.priceEur)
                    )}
                  </TableCell>
                  <TableCell>
                    <StockControls
                      variantId={r.variantId}
                      initial={r.stock}
                      lowThreshold={lowThreshold}
                    />
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
