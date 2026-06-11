import { ClaimsQueue } from '@/components/admin/claims/claims-queue'

export default function TheftPage() {
  return (
    <ClaimsQueue
      type="theft"
      title="Vol"
      subtitle="Boards déclarées volées — suivi et traitement."
    />
  )
}
