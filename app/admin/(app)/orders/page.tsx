import { getOrders } from '@/lib/admin/orders'
import { formatEur } from '@/lib/format-price'
import { OrdersTable } from '@/components/admin/orders/orders-table'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card'

export default async function AdminOrdersPage() {
  const orders = await getOrders()
  const revenue = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((s, o) => s + Number(o.totalEur), 0)
  const toShip = orders.filter((o) => o.status === 'paid' || o.status === 'preparing').length

  const kpis = [
    { label: 'Commandes', value: String(orders.length) },
    { label: 'À expédier', value: String(toShip) },
    { label: 'CA encaissé', value: formatEur(revenue, 'fr') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Commandes</h1>
        <p className="text-muted-foreground text-sm">Toutes les commandes, web et créées à la main.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <OrdersTable orders={orders} />
    </div>
  )
}
