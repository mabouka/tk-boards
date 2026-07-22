import { notFound } from 'next/navigation'
import { getProduct, getProducts } from '@/lib/admin/products'
import { getProductShippingRates } from '@/lib/admin/shipping'
import { countryOptions } from '@/lib/countries'
import { ProductForm } from '@/components/admin/product-form'
import { ShippingRates } from '@/components/admin/products/shipping-rates'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, all, rates] = await Promise.all([
    getProduct(id),
    getProducts(),
    getProductShippingRates(id),
  ])
  if (!product) notFound()

  return (
    <div className="flex flex-col gap-6">
      <ProductForm
        initial={product}
        allProducts={all.filter((p) => p.id !== id).map((p) => ({ id: p.id, sku: p.sku, name: p.name }))}
      />
      <ShippingRates productId={id} initial={rates} countries={countryOptions('fr')} />
    </div>
  )
}
