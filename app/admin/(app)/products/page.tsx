import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getProducts } from '@/lib/admin/products'
import { ProductsTable } from '@/components/admin/products/products-table'
import { Button } from '@/components/admin/ui/button'
import { Card } from '@/components/admin/ui/card'

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

      {rows.length === 0 ? (
        <Card>
          <div className="text-muted-foreground p-10 text-center text-sm">
            Aucun produit. Crée ton premier produit.
          </div>
        </Card>
      ) : (
        <ProductsTable rows={rows} />
      )}
    </div>
  )
}
