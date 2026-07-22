'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setOrderStatus, markPaid, refundOrder, type OrderStatus } from '@/app/admin/(app)/orders/actions'
import { Button } from '@/components/admin/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/admin/ui/dialog'
import { ORDER_STATUS_KEYS, orderStatusOf } from './status'

type Props = {
  orderId: string
  status: string
  paymentStatus: string
  paymentMethod: string
}

// "Refunded" is reached only via the Rembourser button (which actually issues the
// Stripe refund), never as a free status change — so it's dropped from the menu.
const SELECTABLE = ORDER_STATUS_KEYS.filter((k) => k !== 'refunded')

export function OrderActions({ orderId, status, paymentStatus, paymentMethod }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [paid, setPaid] = useState(paymentStatus === 'paid')
  const [pending, startTransition] = useTransition()
  const [refundOpen, setRefundOpen] = useState(false)

  function change(next: string) {
    const prev = current
    setCurrent(next) // optimistic
    startTransition(async () => {
      const res = await setOrderStatus(orderId, next as OrderStatus)
      if (res.ok) {
        if (next === 'paid') setPaid(true)
        toast.success('Statut mis à jour.')
        router.refresh()
      } else {
        setCurrent(prev)
        toast.error(res.error)
      }
    })
  }

  function pay() {
    startTransition(async () => {
      const res = await markPaid(orderId)
      if (res.ok) {
        setPaid(true)
        setCurrent('paid')
        toast.success('Commande marquée payée.')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  function refund() {
    startTransition(async () => {
      const res = await refundOrder(orderId)
      if (res.ok) {
        setRefundOpen(false)
        setCurrent('refunded')
        setPaid(false)
        toast.success('Commande remboursée.')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  if (current === 'refunded') {
    return <span className="text-muted-foreground text-sm">Commande remboursée</span>
  }

  const isStripe = paymentMethod === 'stripe'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={current} onValueChange={change} disabled={pending}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SELECTABLE.map((k) => (
            <SelectItem key={k} value={k}>
              {orderStatusOf(k).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!paid && paymentMethod !== 'stripe' && (
        <Button onClick={pay} disabled={pending} variant="outline">
          Marquer payée
        </Button>
      )}

      {paid && (
        <Button onClick={() => setRefundOpen(true)} disabled={pending} variant="outline">
          Rembourser
        </Button>
      )}

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser la commande ?</DialogTitle>
            <DialogDescription>
              {isStripe
                ? 'Le paiement Stripe sera intégralement remboursé au client. Cette action est irréversible.'
                : "La commande sera marquée remboursée — le remboursement espèces/virement est à effectuer manuellement. Cette action est irréversible."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={pending}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={refund} disabled={pending}>
              {pending ? 'Remboursement…' : 'Rembourser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
