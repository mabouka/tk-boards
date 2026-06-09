import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getProducts } from '@/lib/admin/products'
import { Button } from '@/components/admin/ui/button'
import { Badge } from '@/components/admin/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/admin/ui/table'
import { Card } from '@/components/admin/ui/card'

const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function priceLabel(min: number | null, max: number | null) {
  if (min == null) return '—'
  const hi = max ?? min
  return min === hi ? eur(min) : `${eur(min)} – ${eur(hi)}`
}

export default async function ProductsPage() {
  const rows = await getProducts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produits</h1>
          <p className="text-muted-foreground text-sm">{rows.length} produit(s) au catalogue.</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="size-4" /> Ajouter un produit
          </Link>
        </Button>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="text-muted-foreground p-10 text-center text-sm">
            Aucun produit. Crée ton premier produit.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/admin/products/${p.id}`} className="block">
                      {p.sku}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{p.kind ?? '—'}</TableCell>
                  <TableCell>{p.variantCount}</TableCell>
                  <TableCell>{priceLabel(p.priceMin, p.priceMax)}</TableCell>
                  <TableCell>
                    <Badge variant={p.active ? 'default' : 'secondary'}>
                      {p.active ? 'Actif' : 'Brouillon'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
