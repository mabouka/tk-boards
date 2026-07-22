import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'
import { getAdminOrder } from '@/lib/admin/orders'
import { invoicingConfigured } from '@/lib/invoice'
import { fmtDate } from '@/lib/admin/format'
import { formatEur } from '@/lib/format-price'
import { OrderActions } from '@/components/admin/orders/order-actions'
import { ShipForm } from '@/components/admin/orders/ship-form'
import { orderStatusOf, PAYMENT_LABEL } from '@/components/admin/orders/status'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'

type Props = { params: Promise<{ id: string }> }

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const data = await getAdminOrder(id)
  if (!data) notFound()
  const { order, lines, customerName } = data

  const eur = (v: string) => formatEur(Number(v), 'fr')
  const st = orderStatusOf(order.status)
  const canShip = ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status)
  const canInvoice = order.paymentStatus === 'paid' && (await invoicingConfigured())
  const shipTo = [
    order.shipName,
    order.shipLine1,
    order.shipLine2,
    [order.shipPostalCode, order.shipCity].filter(Boolean).join(' '),
    order.shipCountry,
  ].filter(Boolean) as string[]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/orders"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Commandes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">#{order.number}</h1>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canInvoice && (
            <Button asChild variant="outline">
              <a href={`/admin/orders/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
                <FileText className="size-4" /> Facture
              </a>
            </Button>
          )}
          <OrderActions
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            paymentMethod={order.paymentMethod}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Articles</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead className="text-right">PU</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="text-sm">{l.productName}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {[l.variantSku, l.variantLabel].filter(Boolean).join(' · ')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{l.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{eur(l.unitPriceEur)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {eur((Number(l.unitPriceEur) * l.qty).toFixed(2))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <CardContent className="mt-4 flex flex-col gap-1.5 text-sm">
            <Row label="Sous-total" value={eur(order.subtotalEur)} />
            <Row label="Livraison" value={eur(order.shippingEur)} />
            <Row label="Total" value={eur(order.totalEur)} strong />
            <Row label="Dont TVA" value={eur(order.taxEur)} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div>{customerName ?? '—'}</div>
              <div className="text-muted-foreground">{order.email}</div>
              <div className="text-muted-foreground mt-2">Commandée le {fmtDate(order.createdAt)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Livraison</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {shipTo.length ? (
                shipTo.map((l, i) => <div key={i}>{l}</div>)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paiement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div>{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</div>
              <div className="text-muted-foreground">
                {order.paymentStatus === 'paid' ? 'Payée' : 'En attente'}
              </div>
            </CardContent>
          </Card>

          {canShip && (
            <ShipForm
              orderId={order.id}
              status={order.status}
              carrier={order.carrier}
              trackingNumber={order.trackingNumber}
              trackingUrl={order.trackingUrl}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
