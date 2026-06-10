import { test, expect } from '@playwright/test'
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

test('signup → verify email → login', async ({ page }) => {
  const email = `e2e+${Date.now()}@example.com`
  const password = 'TkRider!2026'

  // 1. Email-first step → an unknown email routes to sign-up.
  await page.goto('/en/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="email"]').press('Enter')

  // 2. Fill the sign-up form.
  await expect(page.getByRole('heading', { name: 'Create your TK ID' })).toBeVisible()
  await page.locator('input[name="first_name"]').fill('Test')
  await page.locator('input[name="last_name"]').fill('Rider')
  await page.locator('input[name="password"]').fill(password)
  await page.locator('input[name="password2"]').fill(password)
  await page.getByRole('button', { name: 'Create my TK ID' }).click()

  // 3. No auto-login — a "check your email" confirmation replaces the form.
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()

  // 4. Follow the verification link and confirm (POST, scanner-safe).
  await page.goto(latestVerifyUrl(email))
  await page.getByRole('button', { name: 'Confirm my email' }).click()

  // 5. Redirected back to login with the verified flash.
  await expect(page).toHaveURL(/\/en\/login\?verified=1/)

  // 6. Sign in with the new credentials.
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="email"]').press('Enter')
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // 7. Authenticated → the member account area.
  await expect(page).toHaveURL(/\/en\/account/)
})
