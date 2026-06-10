import { appendFileSync } from 'node:fs'
import { createElement, type ReactElement } from 'react'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import VerifyEmail from '@/emails/verify-email'
import ResetPasswordEmail from '@/emails/reset-password'
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
