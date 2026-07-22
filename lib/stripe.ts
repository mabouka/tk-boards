import Stripe from 'stripe'

/**
 * Server-only Stripe client, created on first use.
 *
 * It used to be constructed at module load from `process.env.STRIPE_SECRET_KEY ?? ''`,
 * which made the *build* depend on a runtime secret: `next build` evaluates route
 * modules while collecting page data, and the SDK throws on an empty key
 * ("Neither apiKey nor config.authenticator provided"), so a deploy without the
 * variable set failed to compile instead of failing at request time.
 *
 * Instantiating lazily keeps the build independent of secrets, and a genuinely
 * missing key now surfaces where it can be acted on — in the request that needed
 * Stripe — with a message that names the variable.
 */
let client: Stripe | null = null

function stripeClient(): Stripe {
  if (client) return client
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set — checkout and refunds are unavailable.')
  }
  client = new Stripe(key, { typescript: true })
  return client
}

// A proxy so call sites keep reading `stripe.checkout.sessions.create(…)` unchanged.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const c = stripeClient() as unknown as Record<string | symbol, unknown>
    const value = c[prop]
    return typeof value === 'function' ? value.bind(c) : value
  },
})
