import Link from 'next/link'
import { and, count, eq, gt, lte } from 'drizzle-orm'
import { db } from '@/db'
import { products, variants, units, users } from '@/db/schema'
import { getOrders } from '@/lib/admin/orders'
import { formatEur } from '@/lib/format-price'
import { fmtDate } from '@/lib/admin/format'
import { LOW_STOCK_THRESHOLD } from '@/lib/admin/stock-ui'
import { Badge } from '@/components/admin/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
const ORDER_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  pending_payment: { label: 'En attente', variant: 'secondary' },
  paid: { label: 'Payée', variant: 'default' },
  preparing: { label: 'Préparation', variant: 'default' },
  shipped: { label: 'Expédiée', variant: 'outline' },
  delivered: { label: 'Livrée', variant: 'outline' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
  refunded: { label: 'Remboursée', variant: 'destructive' },
}

export default async function AdminDashboard() {
  const [orders, [prod], [outStock], [lowStock], [stolen], [acct]] = await Promise.all([
    getOrders(),
    db.select({ n: count() }).from(products),
    db
      .select({ n: count() })
      .from(variants)
      .where(and(eq(variants.active, true), eq(variants.stock, 0))),
    db
      .select({ n: count() })
      .from(variants)
      .where(and(eq(variants.active, true), gt(variants.stock, 0), lte(variants.stock, LOW_STOCK_THRESHOLD))),
    db.select({ n: count() }).from(units).where(eq(units.status, 'stolen')),
    db.select({ n: count() }).from(users),
  ])

  const revenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((s, o) => s + Number(o.totalEur), 0)
  const toShip = orders.filter((o) => o.status === 'paid' || o.status === 'preparing').length
  const recent = orders.slice(0, 6)

  const kpis = [
    { label: 'Commandes', value: String(orders.length) },
    { label: 'À expédier', value: String(toShip) },
    { label: 'CA encaissé', value: formatEur(revenue, 'fr') },
    { label: 'Comptes', value: String(acct?.n ?? 0) },
  ]

  const alerts = [
    { label: 'Ruptures de stock', value: outStock?.n ?? 0, href: '/admin/stock', danger: true },
    { label: `Stock faible (≤ ${LOW_STOCK_THRESHOLD})`, value: lowStock?.n ?? 0, href: '/admin/stock', danger: false },
    { label: 'Planches perdues / volées', value: stolen?.n ?? 0, href: '/admin/theft', danger: true },
    { label: 'Produits au catalogue', value: prod?.n ?? 0, href: '/admin/products', danger: false },
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
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Commandes récentes</CardTitle>
              <Link
                href="/admin/orders"
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                Tout voir
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">Aucune commande.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((o) => {
                    const st = ORDER_STATUS[o.status] ?? { label: o.status, variant: 'outline' as const }
                    return (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="font-mono text-xs hover:underline"
                          >
                            {o.number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{o.customer}</TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatEur(Number(o.totalEur), 'fr')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right text-sm">
                          {fmtDate(o.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alertes &amp; catalogue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            {alerts.map((al) => (
              <Link
                key={al.label}
                href={al.href}
                className="hover:bg-muted/50 -mx-2 flex items-center justify-between rounded-md px-2 py-2"
              >
                <span className="text-sm">{al.label}</span>
                <span
                  className={`text-sm font-medium tabular-nums ${
                    al.danger && al.value > 0 ? 'text-destructive' : ''
                  }`}
                >
                  {al.value}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
