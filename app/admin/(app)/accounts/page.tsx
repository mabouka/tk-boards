import { auth } from '@/auth'
import { getAccounts } from '@/lib/admin/accounts'
import { AccountsTable } from '@/components/admin/accounts/accounts-table'
import { CreateAccountDialog } from '@/components/admin/accounts/create-account-dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card'

// Module scope (not in render) to keep the component pure for eslint.
function recentCount(rows: { createdAt: Date }[], days = 30): number {
  const cutoff = Date.now() - days * 864e5
  return rows.filter((r) => r.createdAt.getTime() >= cutoff).length
}

export default async function AccountsPage() {
  const [session, accounts] = await Promise.all([auth(), getAccounts()])
  const admins = accounts.filter((a) => a.role === 'admin').length
  const clients = accounts.length - admins
  const recent = recentCount(accounts)

  const kpis = [
    { label: 'Comptes', value: accounts.length },
    { label: 'Clients', value: clients },
    { label: 'Admins', value: admins },
    { label: 'Nouveaux (30 j)', value: recent },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Comptes</h1>
          <p className="text-muted-foreground text-sm">Clients et administrateurs.</p>
        </div>
        <CreateAccountDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>

      <AccountsTable accounts={accounts} currentUserId={session?.user?.id ?? ''} />
    </div>
  )
}
