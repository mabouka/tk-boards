import Link from 'next/link'
import { fmtDate } from '@/lib/admin/format'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAccount } from '@/lib/admin/accounts'
import { Badge } from '@/components/admin/ui/badge'
import { Button } from '@/components/admin/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/admin/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'
import { AccountInfoForm } from '@/components/admin/accounts/account-info-form'
import { AddressManager } from '@/components/admin/accounts/address-manager'

const UNIT_STATUS: Record<string, string> = {
  minted: 'À assigner',
  provisioned: 'Prête',
  registered: 'Enregistrée',
  stolen: 'Perdue / volée',
  transferred: 'Transférée',
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const a = await getAccount(id)
  if (!a) notFound()

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/accounts" aria-label="Retour">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{a.name}</h1>
          <p className="text-muted-foreground text-sm">{a.email}</p>
        </div>
        <Badge variant={a.role === 'admin' ? 'default' : 'secondary'} className="ml-2">
          {a.role === 'admin' ? 'Admin' : 'Client'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AccountInfoForm
          account={{
            id: a.id,
            firstName: a.firstName,
            lastName: a.lastName,
            phone: a.phone,
            locale: a.locale,
            email: a.email,
            method: a.method,
            emailVerified: a.emailVerified,
            createdAt: a.createdAt,
          }}
        />
        <AddressManager userId={a.id} addresses={a.addresses} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Boards enregistrées · {a.boards.length}</CardTitle>
        </CardHeader>
        {a.boards.length === 0 ? (
          <CardContent className="text-muted-foreground pt-0 text-sm">
            Aucune board enregistrée.
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Série</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Enregistrée le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.boards.map((b) => (
                <TableRow key={b.registrationId}>
                  <TableCell className="font-medium">{b.productName ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{b.sku ?? '—'}</TableCell>
                  <TableCell className="font-mono text-xs">{b.serial ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={b.unitStatus === 'stolen' ? 'destructive' : 'secondary'}>
                      {UNIT_STATUS[b.unitStatus] ?? b.unitStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{fmtDate(b.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
