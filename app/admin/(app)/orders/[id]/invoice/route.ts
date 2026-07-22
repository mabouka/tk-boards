import { requireAdmin } from '@/lib/require-admin'
import { getAdminInvoice, invoicePdfResponse, renderInvoicePdf } from '@/lib/invoice'

export const runtime = 'nodejs'

// Same document from the back-office, for any order.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await ctx.params

  const data = await getAdminInvoice(id)
  if (!data) return new Response('Not found', { status: 404 })

  return invoicePdfResponse(await renderInvoicePdf(data), data.number)
}
