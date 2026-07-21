'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { claims } from '@/db/schema'
import { requireAdmin } from '@/lib/require-admin'

const STATUSES = ['open', 'in_review', 'resolved', 'rejected'] as const
export type ClaimStatus = (typeof STATUSES)[number]

type Result = { ok: true } | { ok: false; error: string }

export async function setClaimStatus(claimId: string, status: ClaimStatus): Promise<Result> {
  await requireAdmin()
  if (!claimId || !STATUSES.includes(status)) return { ok: false, error: 'Statut invalide.' }
  await db.update(claims).set({ status }).where(eq(claims.id, claimId))
  revalidatePath('/admin/theft') // lost/stolen queue (ClaimsTable)
  return { ok: true }
}
