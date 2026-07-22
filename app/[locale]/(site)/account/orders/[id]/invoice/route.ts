import { liveSession } from '@/lib/session'
import { getUserInvoice, invoicePdfResponse, renderInvoicePdf } from '@/lib/invoice'

export const runtime = 'nodejs'

// The buyer's own invoice. Scoped to the session owner, so an order number alone
// never exposes someone else's document.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const session = await liveSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const data = await getUserInvoice(session.userId, decodeURIComponent(id))
  if (!data) return new Response('Not found', { status: 404 })

  return invoicePdfResponse(await renderInvoicePdf(data), data.number)
}
