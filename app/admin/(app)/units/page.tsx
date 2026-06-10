import { getUnits, getBoardVariants, getMintedUnits } from '@/lib/admin/units'
import { UnitsToolbar } from '@/components/admin/units/units-toolbar'
import { UnitsTable } from '@/components/admin/units/units-table'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card'

export default async function UnitsPage() {
  const [units, boardVariants, mintedUnits] = await Promise.all([
    getUnits(),
    getBoardVariants(),
    getMintedUnits(),
  ])

  const count = (s: string) => units.filter((u) => u.status === s).length
  const kpis = [
    { label: 'Total unités', value: units.length },
    { label: 'À assigner', value: count('minted') },
    { label: 'Prêtes', value: count('provisioned') },
    { label: 'Enregistrées', value: count('registered') },
    { label: 'Volées', value: count('stolen') },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Registre NFC</h1>
          <p className="text-muted-foreground text-sm">
            Tokens des tags, appairés aux planches (TK ID). Boards uniquement.
          </p>
        </div>
        <UnitsToolbar boardVariants={boardVariants} mintedUnits={mintedUnits} />
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

      <UnitsTable units={units} boardVariants={boardVariants} />
    </div>
  )
}
