import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { OUTBOX } from './constants'

// The verification email carries the raw token (the DB only stores its hash), so
// the dev mailer writes the link to the outbox and we read it back here.
function latestVerifyUrl(to: string): string {
  const lines = readFileSync(OUTBOX, 'utf8').trim().split('\n').filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    const [addr, note = ''] = lines[i].split('\t')
    if (addr === to && note.includes('verify')) {
      const m = note.match(/https?:\/\/\S+/)
      if (m) return m[0]
    }
  }
  throw new Error(`no verification link captured for ${to}`)
}

// Full new-account journey: email-first → sign up → confirm email → sign in.
// Leaves the browser on whatever post-login destination the flow resolved.
async function signupVerifyLogin(page: Page, email: string, password: string, startUrl: string) {
  await page.goto(startUrl)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="email"]').press('Enter')

  await expect(page.getByRole('heading', { name: 'Create your TK ID' })).toBeVisible()
  await page.locator('input[name="first_name"]').fill('Test')
  await page.locator('input[name="last_name"]').fill('Rider')
  await page.locator('input[name="password"]').fill(password)
  await page.locator('input[name="password2"]').fill(password)
  await page.getByRole('button', { name: 'Create my TK ID' }).click()

  // No auto-login — a "check your email" confirmation replaces the form.
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

  // Follow the verification link and confirm (POST, scanner-safe).
  await page.goto(latestVerifyUrl(email))
  await page.getByRole('button', { name: 'Confirm my email' }).click()
  await expect(page).toHaveURL(/\/en\/login\?verified=1/)

  // Sign in with the new credentials.
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="email"]').press('Enter')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('signup → verify email → login lands on the account area', async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`
  await signupVerifyLogin(page, email, 'TkRider!2026', '/en/login')
  await expect(page).toHaveURL(/\/en\/account/)
})

test('callbackUrl survives the whole signup → verify → login journey', async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`
  const dest = '/en/account/boards'
  await signupVerifyLogin(page, email, 'TkRider!2026', `/en/login?callbackUrl=${encodeURIComponent(dest)}`)
  // A brand-new account returns to where it started (e.g. a tapped TK ID tag),
  // not the default /account — the callback rode through the email round-trip.
  await expect(page).toHaveURL(/\/en\/account\/boards$/)
})
