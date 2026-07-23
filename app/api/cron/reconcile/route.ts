import { unreconciledPayments } from '@/lib/reconcile'
import { sendOpsAlertEmail } from '@/lib/email'
import { safeEqual } from '@/lib/safe-compare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Scheduled check for money that never became an order.
 *
 * The Stripe webhook is the only place a payment turns into an order, and its
 * failure is silent — a schema change once made every delivery 500 and three paid
 * sessions sat unrecorded until a customer noticed. This runs on a schedule and
 * mails the shop when anything is unaccounted for.
 *
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; the route refuses
 * everything else so it can't be triggered (or used to probe payments) publicly.
 * With no secret configured it stays closed rather than open. The header is matched
 * in constant time so response latency can't be used to walk the secret out.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || !safeEqual(req.headers.get('authorization'), `Bearer ${secret}`)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const missing = await unreconciledPayments()
  if (missing.length === 0) {
    return Response.json({ ok: true, unreconciled: 0 })
  }

  const total = missing.reduce((s, m) => s + Number(m.amountEur), 0).toFixed(2)

  // Say so loudly rather than mail a noreply address nobody reads: monitoring that
  // reports success while alerting into the void is worse than none. The failure is
  // visible in the cron's own logs and response.
  if (!process.env.CONTACT_EMAIL) {
    return Response.json(
      {
        ok: false,
        unreconciled: missing.length,
        totalEur: total,
        error: 'CONTACT_EMAIL is not set — no alert could be delivered.',
      },
      { status: 500 }
    )
  }
  await sendOpsAlertEmail({
    subject: `⚠️ ${missing.length} paiement(s) sans commande — ${total} €`,
    lines: [
      `${missing.length} paiement(s) Stripe encaissé(s) sans commande enregistrée.`,
      '',
      ...missing.map(
        (m) =>
          `${m.createdAt.toISOString()}  ${m.amountEur} €  ${m.email}  ${m.sessionId}` +
          (m.paymentIntentId ? `  (${m.paymentIntentId})` : '')
      ),
      '',
      'Rejouer l’événement Stripe correspondant recrée la commande sans',
      'toucher au stock (déjà réservé au checkout) :',
      '  stripe events resend <event_id>',
    ],
  })

  return Response.json({ ok: false, unreconciled: missing.length, totalEur: total })
}
