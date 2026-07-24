import { eshopEnabled } from '@/lib/eshop'
import { SettingToggle } from '@/components/admin/settings/setting-toggle'
import { setEshopEnabled } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const enabled = await eshopEnabled()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>
        <p className="text-muted-foreground text-sm">Interrupteurs du site public.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Boutique en ligne</CardTitle>
          <CardDescription>
            Activée : les visiteurs voient les boutons d’achat, le panier et le paiement. Désactivée
            (V1) : le prix reste affiché mais les boutons d’achat deviennent des boutons de contact,
            le panier disparaît et le paiement est fermé. Tu peux forcer l’affichage pour un compte
            précis depuis sa fiche (Clients → un compte), pour travailler dessus avant l’ouverture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingToggle
            initial={enabled}
            action={setEshopEnabled}
            onLabel="Boutique activée"
            offLabel="Boutique désactivée"
            aria-label="Activer la boutique en ligne"
            successOn="Boutique activée."
            successOff="Boutique désactivée."
          />
        </CardContent>
      </Card>
    </div>
  )
}
