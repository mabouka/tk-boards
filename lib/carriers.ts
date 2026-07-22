// Known carriers → a public tracking URL built from the tracking number. The
// admin can always paste an explicit URL (which wins); an unknown carrier simply
// shows as "carrier + number" with no link. Keys are lowercased carrier names.
const TEMPLATES: Record<string, (n: string) => string> = {
  colissimo: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
  'la poste': (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
  chronopost: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}`,
  'mondial relay': (n) => `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${n}`,
  dhl: (n) => `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`,
  ups: (n) => `https://www.ups.com/track?tracknum=${n}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${n}`,
  bpost: (n) => `https://track.bpost.cloud/btr/web/#/search?itemCode=${n}`,
  postnl: (n) => `https://postnl.nl/tracktrace/?B=${n}`,
  gls: (n) => `https://gls-group.com/track/${n}`,
  dpd: (n) => `https://www.dpd.com/tracking?parcelNumber=${n}`,
  tnt: (n) => `https://www.tnt.com/express/en_gc/site/tracking.html?searchType=con&cons=${n}`,
}

// Suggestions for the admin carrier field (datalist). Free text is still allowed.
export const CARRIERS = [
  'Colissimo',
  'Chronopost',
  'Mondial Relay',
  'bpost',
  'DHL',
  'UPS',
  'FedEx',
  'DPD',
  'GLS',
  'PostNL',
  'TNT',
]

/** Build a tracking URL for a known carrier, or null if we don't recognise it. */
export function trackingUrlFor(carrier: string, trackingNumber: string): string | null {
  const tpl = TEMPLATES[carrier.trim().toLowerCase()]
  const n = trackingNumber.trim()
  if (!tpl || !n) return null
  return tpl(encodeURIComponent(n))
}
