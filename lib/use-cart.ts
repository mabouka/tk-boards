// Public cart hook. State lives in the CartProvider (components/cart/CartContext)
// so the header trigger, the add-to-cart CTAs and the <CartDrawer/> overlay all
// share one persistent cart. Use `addItem(line)` to add a configured product.
export { useCart } from '@/components/commerce/cart/CartContext'
