import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export type AccountRow = {
  id: string
  name: string
  email: string
  role: 'customer' | 'admin'
  method: 'password' | 'google'
  createdAt: Date
}

export async function getAccounts(): Promise<AccountRow[]> {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt))
  return rows.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || '—',
    email: u.email,
    role: u.role === 'admin' ? 'admin' : 'customer',
    method: u.passwordHash ? 'password' : 'google',
    createdAt: u.createdAt,
  }))
}
