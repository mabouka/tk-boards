import { appendFileSync } from 'node:fs'
import { createElement, type ReactElement } from 'react'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import VerifyEmail from '@/emails/verify-email'
import ResetPasswordEmail from '@/emails/reset-password'
import ContactEmail from '@/emails/contact-email'
import FoundBoardEmail from '@/emails/found-board'
import TransferEmail from '@/emails/transfer'
import OrderConfirmationEmail from '@/emails/order-confirmation'
import { emailT } from '@/lib/email-i18n'

const FROM = process.env.EMAIL_FROM || 'TK Boards <onboarding@resend.dev>'
const KEY = process.env.RESEND_API_KEY
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Render an email component to both HTML and plain text (better deliverability).
async function renderBoth(element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ])
  return { html, text }
}

// Sends via Resend when configured; otherwise logs the action link to the server
// console so the full flow is testable in dev without a Resend key.
async function send(opts: {
  to: string
  subject: string
  html: string
  text: string
  devNote: string
  replyTo?: string
}) {
  if (!KEY) {
    console.log(`\n📧 [email:dev] → ${opts.to}\n   ${opts.subject}\n   ${opts.devNote}\n`)
    // E2E: persist the action link so the test can follow it (the raw token is
    // never stored in the DB — only its hash). Off unless EMAIL_OUTBOX_FILE is set.
    if (process.env.EMAIL_OUTBOX_FILE) {
      appendFileSync(process.env.EMAIL_OUTBOX_FILE, `${opts.to}\t${opts.devNote}\n`)
    }
    return
  }
  const resend = new Resend(KEY)
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  })
  if (error) throw new Error(error.message)
}

export async function sendVerificationEmail(opts: {
  to: string
  locale: string
  token: string
  callbackUrl?: string
}) {
  const cb = opts.callbackUrl ? `&callbackUrl=${encodeURIComponent(opts.callbackUrl)}` : ''
  const url = `${BASE}/${opts.locale}/verify?token=${opts.token}${cb}`
  const { html, text } = await renderBoth(createElement(VerifyEmail, { url, locale: opts.locale }))
  await send({
    to: opts.to,
    subject: emailT(opts.locale).verifySubject,
    html,
    text,
    devNote: `verify → ${url}`,
  })
}

export async function sendContactEmail(data: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  product?: string
  message: string
}) {
  // Submissions land in the TK inbox; falls back to the from-address if unset.
  const to = process.env.CONTACT_EMAIL || FROM
  const { html, text } = await renderBoth(createElement(ContactEmail, data))
  await send({
    to,
    subject: `New contact — ${data.firstName} ${data.lastName}`,
    html,
    text,
    replyTo: data.email,
    devNote: `contact from ${data.email}: ${data.message.slice(0, 80)}`,
  })
}

// A finder used the public "contact the owner" form on a registered board. The
// message reaches the owner; replyTo lets them answer without ever exposing
// their own address to the finder.
export async function sendFoundBoardEmail(opts: {
  to: string
  locale: string
  boardName: string | null
  serial: string | null
  photoUrl: string | null
  attributes: { name: string; value: string; swatchHex: string | null }[]
  token: string
  message: string
  finderEmail: string
  finderPhone?: string
}) {
  const url = `${BASE}/${opts.locale}/tk-id/${opts.token}`
  const { html, text } = await renderBoth(
    createElement(FoundBoardEmail, {
      locale: opts.locale,
      boardName: opts.boardName,
      serial: opts.serial,
      photoUrl: opts.photoUrl,
      attributes: opts.attributes,
      message: opts.message,
      finderEmail: opts.finderEmail,
      finderPhone: opts.finderPhone,
      url,
    })
  )
  await send({
    to: opts.to,
    subject: emailT(opts.locale).foundSubject,
    html,
    text,
    replyTo: opts.finderEmail,
    devNote: `found-board → ${opts.to} (reply ${opts.finderEmail})`,
  })
}

// Ownership-transfer invitation — a tokenised link only the invited email can use.
export async function sendTransferEmail(opts: {
  to: string
  locale: string
  boardName: string | null
  serial: string | null
  photoUrl: string | null
  attributes: { name: string; value: string; swatchHex: string | null }[]
  token: string
}) {
  const url = `${BASE}/${opts.locale}/transfer?token=${opts.token}`
  const { html, text } = await renderBoth(
    createElement(TransferEmail, {
      locale: opts.locale,
      boardName: opts.boardName,
      serial: opts.serial,
      photoUrl: opts.photoUrl,
      attributes: opts.attributes,
      url,
    })
  )
  await send({
    to: opts.to,
    subject: emailT(opts.locale).transferSubject,
    html,
    text,
    devNote: `transfer → ${opts.to}`,
  })
}

// Order confirmation (branded, alongside Stripe's own receipt). Amounts come in
// as euro strings ('490.00') and are formatted for the buyer's locale.
export async function sendOrderConfirmationEmail(opts: {
  to: string
  locale: string
  orderNumber: string
  lines: { name: string; qty: number; totalEur: string }[]
  subtotalEur: string
  taxEur: string
  shippingEur: string
  totalEur: string
  shipTo: string
}) {
  const fmt = (v: string) =>
    new Intl.NumberFormat(opts.locale, { style: 'currency', currency: 'EUR' }).format(Number(v))
  const url = `${BASE}/${opts.locale}/account/orders`
  const { html, text } = await renderBoth(
    createElement(OrderConfirmationEmail, {
      locale: opts.locale,
      orderNumber: opts.orderNumber,
      lines: opts.lines.map((l) => ({ name: l.name, qty: l.qty, total: fmt(l.totalEur) })),
      subtotal: fmt(opts.subtotalEur),
      tax: fmt(opts.taxEur),
      shipping: fmt(opts.shippingEur),
      total: fmt(opts.totalEur),
      shipTo: opts.shipTo,
      url,
    })
  )
  await send({
    to: opts.to,
    subject: emailT(opts.locale).orderSubject,
    html,
    text,
    devNote: `order ${opts.orderNumber} → ${opts.to}`,
  })
}

export async function sendPasswordResetEmail(opts: { to: string; locale: string; token: string }) {
  const url = `${BASE}/${opts.locale}/reset-password?token=${opts.token}`
  const { html, text } = await renderBoth(
    createElement(ResetPasswordEmail, { url, locale: opts.locale })
  )
  await send({
    to: opts.to,
    subject: emailT(opts.locale).resetSubject,
    html,
    text,
    devNote: `reset → ${url}`,
  })
}
