import { count } from 'drizzle-orm'
import { db } from '@/db'
import { products, variants, units, users } from '@/db/schema'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/admin/ui/card'

export default async function AdminDashboard() {
  const [[p], [v], [u], [a]] = await Promise.all([
    db.select({ n: count() }).from(products),
    db.select({ n: count() }).from(variants),
    db.select({ n: count() }).from(units),
    db.select({ n: count() }).from(users),
  ])

  const kpis = [
    { label: 'Produits', value: p?.n ?? 0, hint: 'au catalogue' },
    { label: 'Variantes', value: v?.n ?? 0, hint: 'SKU vendables' },
    { label: 'Unités NFC', value: u?.n ?? 0, hint: 'registre' },
    { label: 'Comptes', value: a?.n ?? 0, hint: 'clients + admins' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Vue d’ensemble TK Boards.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-xs">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
