import { getProducts } from '@/lib/admin/products'
import { ProductForm } from '@/components/admin/product-form'

export default async function NewProductPage() {
  const all = await getProducts()
  return <ProductForm allProducts={all.map((p) => ({ id: p.id, sku: p.sku, name: p.name }))} />
}
