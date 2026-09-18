'use client'

import { useTransition } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportOrdersCsv } from '@/app/admin/(app)/orders/actions'
import { Button } from '@/components/admin/ui/button'

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function OrdersExportButton() {
  const [pending, startTransition] = useTransition()

  const run = () =>
    startTransition(async () => {
      try {
        const csv = await exportOrdersCsv()
        download(`commandes-${new Date().toISOString().slice(0, 10)}.csv`, csv)
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
