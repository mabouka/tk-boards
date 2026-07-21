import type { OrderStatus } from '@/app/admin/(app)/orders/actions'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

// Admin UI is French-only (like the rest of the back-office).
export const ORDER_STATUS: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending_payment: { label: 'En attente de paiement', variant: 'secondary' },
  paid: { label: 'Payée', variant: 'default' },
  preparing: { label: 'En préparation', variant: 'outline' },
  shipped: { label: 'Expédiée', variant: 'default' },
  delivered: { label: 'Livrée', variant: 'default' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
  refunded: { label: 'Remboursée', variant: 'destructive' },
}

export const ORDER_STATUS_KEYS = Object.keys(ORDER_STATUS) as OrderStatus[]

export const orderStatusOf = (s: string) =>
  ORDER_STATUS[s as OrderStatus] ?? { label: s, variant: 'secondary' as const }

export const PAYMENT_LABEL: Record<string, string> = {
  stripe: 'Stripe',
  cash: 'Espèces',
  transfer: 'Virement',
}
