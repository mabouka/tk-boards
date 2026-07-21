'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setOrderStatus, markPaid, type OrderStatus } from '@/app/admin/(app)/orders/actions'
import { Button } from '@/components/admin/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/admin/ui/select'
import { ORDER_STATUS_KEYS, orderStatusOf } from './status'

type Props = {
  orderId: string
  status: string
  paymentStatus: string
  paymentMethod: string
}

export function OrderActions({ orderId, status, paymentStatus, paymentMethod }: Props) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [paid, setPaid] = useState(paymentStatus === 'paid')
  const [pending, startTransition] = useTransition()

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

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={current} onValueChange={change} disabled={pending}>
        <SelectTrigger className="w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUS_KEYS.map((k) => (
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
    </div>
  )
}
