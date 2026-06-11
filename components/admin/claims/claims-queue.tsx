import { getClaims } from '@/lib/admin/claims'
import { ClaimsTable } from '@/components/admin/claims/claims-table'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card'

// Shared admin queue for one claim type (warranty/theft): KPIs + filterable table.
// Used by both /admin/claims and /admin/theft.
export async function ClaimsQueue({
  type,
  title,
  subtitle,
}: {
  type: 'warranty' | 'theft'
  title: string
  subtitle: string
}) {
  const claims = await getClaims(type)
  const count = (s: string) => claims.filter((c) => c.status === s).length
  const kpis = [
    { label: 'Total', value: claims.length },
    { label: 'Ouvertes', value: count('open') },
    { label: 'En cours', value: count('in_review') },
    { label: 'Résolues', value: count('resolved') },
    { label: 'Rejetées', value: count('rejected') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="pb-2">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{k.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <ClaimsTable claims={claims} />
    </div>
  )
}
