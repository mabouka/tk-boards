import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getAccounts } from '@/lib/admin/accounts'
import { getPickableVariants } from '@/lib/admin/orders'
import { NewOrderForm } from '@/components/admin/orders/new-order-form'

export default async function NewOrderPage() {
  const [accounts, variants] = await Promise.all([getAccounts(), getPickableVariants()])

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/orders"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" /> Commandes
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle commande</h1>
        <p className="text-muted-foreground text-sm">
          Commande manuelle (cash / virement) pour un compte existant.
        </p>
      </div>
      <NewOrderForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name, email: a.email }))}
        variants={variants}
      />
    </div>
  )
}
