import Stripe from 'stripe'

// Server-only Stripe client. The secret key is set in env (STRIPE_SECRET_KEY),
// never committed. API version is left to the SDK/account default.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  typescript: true,
})
