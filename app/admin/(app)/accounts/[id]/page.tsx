import Link from 'next/link'
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

const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(d) : '—'

const UNIT_STATUS: Record<string, string> = {
  minted: 'À assigner',
  provisioned: 'Prête',
  registered: 'Enregistrée',
  stolen: 'Volée',
  transferred: 'Transférée',
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-muted-foreground text-sm">{k}</span>
      <span className="text-right text-sm">{v}</span>
    </div>
  )
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
        <Card>
          <CardHeader>
            <CardTitle>Compte</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Row k="Email" v={a.email} />
            <Row k="Méthode" v={a.method === 'password' ? 'Mot de passe' : 'Google'} />
            <Row k="Email vérifié" v={a.emailVerified ? fmtDate(a.emailVerified) : 'Non'} />
            <Row k="Téléphone" v={a.phone ?? '—'} />
            <Row k="Langue" v={a.locale.toUpperCase()} />
            <Row k="Inscrit le" v={fmtDate(a.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adresses</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {a.addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">Aucune adresse.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {a.addresses.map((ad) => (
                  <div key={ad.id} className="text-sm">
                    {ad.isDefault && (
                      <Badge variant="outline" className="mb-1">
                        Par défaut
                      </Badge>
                    )}
                    <div>{ad.line1}</div>
                    {ad.line2 && <div>{ad.line2}</div>}
                    <div className="text-muted-foreground">
                      {[ad.postalCode, ad.city, ad.country].filter(Boolean).join(', ')}
                    </div>
                    {ad.phone && <div className="text-muted-foreground">{ad.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
                <TableHead>Garantie</TableHead>
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
                  <TableCell className="text-muted-foreground text-sm">
                    {fmtDate(b.warrantyUntil)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{fmtDate(b.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Réclamations · {a.claims.length}</CardTitle>
        </CardHeader>
        {a.claims.length === 0 ? (
          <CardContent className="text-muted-foreground pt-0 text-sm">Aucune réclamation.</CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.claims.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="capitalize">{c.type}</TableCell>
                  <TableCell>
                    {c.productName ?? '—'}{' '}
                    <span className="text-muted-foreground font-mono text-xs">{c.sku}</span>
                  </TableCell>
                  <TableCell className="capitalize">{c.status}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{fmtDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
