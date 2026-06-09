import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/admin/products'
import { ProductForm } from '@/components/admin/product-form'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, all] = await Promise.all([getProduct(id), getProducts()])
  if (!product) notFound()

  return (
    <ProductForm
      initial={product}
      allProducts={all.filter((p) => p.id !== id).map((p) => ({ id: p.id, sku: p.sku, name: p.name }))}
    />
  )
}
