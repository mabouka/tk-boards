'use client'

import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportAccountsCsv } from '@/app/admin/(app)/accounts/actions'
import { downloadTextFile } from '@/lib/download'
import { Button } from '@/components/admin/ui/button'

export function AccountsExportButton() {
  const [pending, startTransition] = useTransition()

  const run = () =>
    startTransition(async () => {
      try {
        const csv = await exportAccountsCsv()
        downloadTextFile(`comptes-${new Date().toISOString().slice(0, 10)}.csv`, csv)
        toast.success('Export CSV téléchargé.')
      } catch {
        toast.error('Échec de l’export.')
      }
    })

  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      <Download className="size-4" /> {pending ? 'Export…' : 'Exporter'}
    </Button>
  )
}
