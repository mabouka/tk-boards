'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { backfillUnitSpecs } from '@/app/admin/(app)/units/actions'
import { Button } from '@/components/admin/ui/button'

export function BackfillSpecsButton() {
  const [pending, startTransition] = useTransition()

  const run = () =>
    startTransition(async () => {
      const res = await backfillUnitSpecs()
      if (res.ok) {
        toast.success(
          res.updated > 0
            ? `${res.updated} unité(s) mise(s) à jour.`
            : 'Rien à faire — toutes les unités sont déjà à jour.'
        )
      } else {
        toast.error(res.error)
      }
    })

  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      {pending ? 'Traitement…' : 'Enregistrer les caractéristiques manquantes'}
    </Button>
  )
}
