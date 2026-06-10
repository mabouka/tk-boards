import { getStockRows } from '@/lib/admin/stock'
import { StockTable } from '@/components/admin/stock/stock-table'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card'

const LOW = 5

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default async function StockPage() {
  const rows = await getStockRows()

  const totalUnits = rows.reduce((s, r) => s + r.stock, 0)
  const stockValue = rows.reduce((s, r) => s + r.stock * (r.salePriceEur ?? r.priceEur ?? 0), 0)
  const low = rows.filter((r) => r.stock > 0 && r.stock <= LOW).length
  const out = rows.filter((r) => r.stock === 0).length

  const kpis = [
    { label: 'Unités en stock', value: String(totalUnits) },
    { label: 'Valeur du stock', value: eur(stockValue) },
    { label: `Stock faible (≤ ${LOW})`, value: String(low) },
    { label: 'En rupture', value: String(out) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Stock</h1>
        <p className="text-muted-foreground text-sm">Inventaire par variante.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <StockTable rows={rows} lowThreshold={LOW} />
    </div>
  )
}
