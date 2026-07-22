'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { shipOrder } from '@/app/admin/(app)/orders/actions'
import { CARRIERS } from '@/lib/carriers'
import { Button } from '@/components/admin/ui/button'
import { Input } from '@/components/admin/ui/input'
import { Label } from '@/components/admin/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/admin/ui/card'

type Props = {
  orderId: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  trackingUrl: string | null
}

export function ShipForm({ orderId, status, carrier, trackingNumber, trackingUrl }: Props) {
  const router = useRouter()
  const [c, setC] = useState(carrier ?? '')
  const [n, setN] = useState(trackingNumber ?? '')
  const [u, setU] = useState(trackingUrl ?? '')
  const [pending, start] = useTransition()
  const shipped = status === 'shipped' || status === 'delivered'

  function submit() {
    if (!c.trim() || !n.trim()) {
      toast.error('Transporteur et numéro de suivi requis.')
      return
    }
    start(async () => {
      const res = await shipOrder({
        orderId,
        carrier: c.trim(),
        trackingNumber: n.trim(),
        trackingUrl: u.trim() || undefined,
      })
      if (res.ok) {
        toast.success(shipped ? 'Suivi mis à jour — client notifié.' : 'Commande expédiée — client notifié.')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expédition</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="carrier">Transporteur</Label>
          <Input
            id="carrier"
            list="carriers"
            value={c}
            onChange={(e) => setC(e.target.value)}
            placeholder="Colissimo, DHL…"
          />
          <datalist id="carriers">
            {CARRIERS.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tracking">N° de suivi</Label>
          <Input id="tracking" value={n} onChange={(e) => setN(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trackurl">
            URL de suivi <span className="text-muted-foreground text-xs">(optionnel)</span>
          </Label>
          <Input
            id="trackurl"
            value={u}
            onChange={(e) => setU(e.target.value)}
            placeholder="auto pour les transporteurs connus"
          />
        </div>
        <Button onClick={submit} disabled={pending}>
          {shipped ? 'Mettre à jour le suivi' : 'Marquer expédiée & notifier'}
        </Button>
      </CardContent>
    </Card>
  )
}
