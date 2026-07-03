import { ClaimsQueue } from '@/components/admin/claims/claims-queue'

export default function TheftPage() {
  return (
    <ClaimsQueue
      type="theft"
      title="Perte / vol"
      subtitle="Boards déclarées perdues / volées — suivi et traitement."
    />
  )
}
