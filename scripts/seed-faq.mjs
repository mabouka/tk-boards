/**
 * Seed the FAQ page content (title / intro / items) for all three locales.
 *
 * Mirrors scripts/migrate-settings.mjs: @sanity/client write client, env from
 * .env.local, needs SANITY_API_WRITE_TOKEN (Editor).
 *
 * Categories (sidebar order): GENERAL, DESIGN & CONSTRUCTION, MAINTENANCE, WARRANTY.
 * The English question wording is taken from Figma (node 93-3170); MAINTENANCE
 * and WARRANTY questions are written here (the design only showed placeholders
 * there). fr/es are faithful translations, category labels included.
 *
 * Only PATCHes title/intro/items on the PUBLISHED faqPage docs — never touches
 * slug/language/SEO, never replaces or deletes the doc.
 *
 * Run:  node --env-file=.env.local scripts/seed-faq.mjs
 */
import { createClient } from '@sanity/client'

// Stable, readable _key from the question text (kept unique per item array).
const keyOf = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

const item = (category, question, answer) => ({
  _type: 'faqItem',
  _key: keyOf(question),
  category,
  question,
  answer,
})

const content = {
  en: {
    title: 'Frequently asked questions',
    intro: 'Everything you need to know about TK boards — how they ride, how they are built, and how to look after them.',
    cat: { general: 'GENERAL', design: 'DESIGN & CONSTRUCTION', maintenance: 'MAINTENANCE', warranty: 'WARRANTY' },
    items: [
      // GENERAL
      ['general', 'What makes the Rocket different from a surf board?',
        'The Rocket is a directional kitesurf board, not a surfboard. It is built specifically to be ridden with a kite — the shape, the stiff carbon layup and the aggressive rocker are all tuned for maximum pop, precision and control under power, rather than for paddling into waves.'],
      ['general', 'Is the Rocket suitable for beginners?',
        'Honestly, no. The Rocket is a directional board designed for riders who already know what they want from a board. A twin-tip is far more forgiving for learning the basics; the Rocket rewards experience with precision and aggressiveness.'],
      ['general', 'What sizes are available and how do I choose the right one?',
        'Each model comes in a range of lengths suited to rider weight, ability and conditions. As a rule, lighter riders and stronger winds favour smaller sizes, while heavier riders and lighter winds favour larger ones. If you are unsure, contact us with your weight and riding style and we will recommend the right size.'],
      ['general', 'Does TK offer custom-made boards?',
        'Yes. Because every board is hand-built in our own workshop, we can tailor dimensions, flex and finish to your weight and riding style. Get in touch to start a custom build — lead times are slightly longer than for stock boards.'],
      ['general', 'Where are TK boards manufactured?',
        'Every TK board is designed and hand-built in our own workshop. We control the entire process in-house, from shaping the paulownia core to the carbon layup and vacuum infusion, so nothing leaves our hands until it meets our standard.'],
      ['general', 'What is the delivery time after placing an order?',
        'Stock boards typically ship within one to two weeks. Custom and made-to-order boards take longer because each one is hand-built to your specification — we will confirm an exact lead time when you order.'],
      ['general', 'Do you offer demo sessions before purchasing?',
        'Yes, whenever possible. We believe a board should be felt before it is bought, so we run demo sessions and attend selected events. Contact us to find out where you can try a TK board near you.'],

      // DESIGN & CONSTRUCTION
      ['design', 'Why do you choose paulownia as the core material?',
        'Paulownia is light, strong and naturally water-resistant, with an excellent stiffness-to-weight ratio. It gives the board a lively, responsive feel and a long lifespan, and as a fast-growing renewable wood it is a more sustainable choice than foam cores.'],
      ['design', 'What is the difference between UD and biax carbon layup?',
        'UD (unidirectional) carbon runs all its fibres in one direction for maximum stiffness and pop along that axis. Biax (biaxial) carbon orients fibres at two angles for torsional strength and a more controlled, damped flex. We combine the two to tune stiffness and feel exactly where each board needs it.'],
      ['design', "How is the Rocket's rocker calculated?",
        'The rocker line is developed and refined through prototyping and on-water testing, not copied from a template. We balance pop, early planing and control so the curve loads and releases energy precisely when you need it for explosive jumps.'],
      ['design', 'What is vacuum infusion?',
        'Vacuum infusion is a construction method where resin is drawn through the dry carbon and core under vacuum pressure. It produces an even, void-free laminate with the optimal resin-to-fibre ratio, which means a lighter, stronger and more consistent board than hand lay-up.'],
      ['design', 'How long does it take to hand-build a single TK board?',
        'A single board passes through many stages — shaping the core, laying up the carbon, vacuum infusion, curing, sanding and finishing — spread over several days. Much of that time is curing and careful hand-finishing, which is why each board is made in small numbers rather than mass-produced.'],

      // MAINTENANCE
      ['maintenance', 'How do I care for my TK board?',
        'Rinse the board with fresh water after every session to remove salt and sand, and let it dry in the shade before storing. Avoid leaving it in direct sun or a hot car for long periods, as prolonged heat can stress the laminate.'],
      ['maintenance', 'How should I store my board between sessions?',
        'Store the board flat or on its rail in a cool, dry place out of direct sunlight, ideally in a padded bag. Keep it away from sources of heat and avoid stacking heavy objects on top of it to protect the deck and rails.'],
      ['maintenance', 'Can I repair a ding myself?',
        'Small surface scratches are cosmetic and harmless. Any ding that breaks through the laminate should be dried out and sealed promptly to stop water reaching the core — for structural repairs we recommend sending it to us or a trusted board repairer to keep the warranty intact.'],
      ['maintenance', 'How do I look after the fins and fin boxes?',
        'Rinse the fins and boxes with fresh water after each session and check the screws regularly. Remove sand from the boxes before refitting, do not over-tighten the screws, and store the fins separately to avoid bending or chipping.'],

      // WARRANTY
      ['warranty', 'What does the TK warranty cover?',
        'Every TK board is covered against manufacturing defects in materials and workmanship for the warranty period stated at purchase. It does not cover normal wear, impact damage, or damage from misuse, improper storage or repairs carried out by third parties.'],
      ['warranty', 'How do I make a warranty claim?',
        'Contact us with your order details and clear photos of the issue. We will assess the claim and, if it is covered, repair or replace the board. Keep your proof of purchase, as it is required for any claim.'],
      ['warranty', 'What is your returns policy?',
        'Stock boards can be returned within the period and condition set out in our terms, provided they are unused and in original packaging. Custom and made-to-order boards are built to your specification and cannot be returned unless faulty.'],
    ],
  },

  fr: {
    title: 'Foire aux questions',
    intro: 'Tout ce qu’il faut savoir sur les boards TK — comment elles se comportent, comment elles sont fabriquées et comment en prendre soin.',
    cat: { general: 'GÉNÉRAL', design: 'DESIGN & CONSTRUCTION', maintenance: 'ENTRETIEN', warranty: 'GARANTIE' },
    items: [
      // GÉNÉRAL
      ['general', 'En quoi la Rocket diffère-t-elle d’une surf board ?',
        'La Rocket est une board de kitesurf directionnelle, et non une planche de surf. Elle est conçue spécifiquement pour être tractée par une aile — la forme, le stratifié carbone rigide et le rocker agressif sont tous optimisés pour un maximum de pop, de précision et de contrôle sous traction, et non pour ramer dans les vagues.'],
      ['general', 'La Rocket convient-elle aux débutants ?',
        'Honnêtement, non. La Rocket est une board directionnelle conçue pour les riders qui savent déjà ce qu’ils attendent d’une planche. Un twin-tip est bien plus tolérant pour apprendre les bases ; la Rocket récompense l’expérience par sa précision et son agressivité.'],
      ['general', 'Quelles tailles sont disponibles et comment choisir la bonne ?',
        'Chaque modèle existe en plusieurs longueurs adaptées au poids du rider, à son niveau et aux conditions. En règle générale, les riders légers et les vents forts privilégient les petites tailles, tandis que les riders plus lourds et les vents légers privilégient les grandes. En cas de doute, contactez-nous avec votre poids et votre style de ride et nous vous conseillerons la bonne taille.'],
      ['general', 'TK propose-t-elle des boards sur mesure ?',
        'Oui. Comme chaque board est fabriquée à la main dans notre propre atelier, nous pouvons adapter les dimensions, le flex et la finition à votre poids et à votre style de ride. Contactez-nous pour lancer une fabrication sur mesure — les délais sont un peu plus longs que pour les modèles en stock.'],
      ['general', 'Où les boards TK sont-elles fabriquées ?',
        'Chaque board TK est conçue et fabriquée à la main dans notre propre atelier. Nous maîtrisons l’ensemble du processus en interne, du façonnage du noyau en paulownia au stratifié carbone et à l’infusion sous vide, afin que rien ne quitte nos mains avant d’atteindre notre niveau d’exigence.'],
      ['general', 'Quel est le délai de livraison après commande ?',
        'Les boards en stock sont généralement expédiées sous une à deux semaines. Les boards sur mesure et fabriquées à la commande demandent plus de temps, car chacune est réalisée à la main selon vos spécifications — nous vous confirmerons un délai précis lors de la commande.'],
      ['general', 'Proposez-vous des sessions d’essai avant l’achat ?',
        'Oui, dès que possible. Nous pensons qu’une board doit se ressentir avant de s’acheter ; nous organisons donc des sessions d’essai et participons à certains événements. Contactez-nous pour savoir où essayer une board TK près de chez vous.'],

      // DESIGN & CONSTRUCTION
      ['design', 'Pourquoi avoir choisi le paulownia comme matériau de noyau ?',
        'Le paulownia est léger, résistant et naturellement hydrofuge, avec un excellent rapport rigidité/poids. Il confère à la board un toucher vif et réactif ainsi qu’une grande durabilité, et comme c’est un bois renouvelable à croissance rapide, c’est un choix plus durable que les noyaux en mousse.'],
      ['design', 'Quelle est la différence entre un stratifié carbone UD et biax ?',
        'Le carbone UD (unidirectionnel) oriente toutes ses fibres dans un seul sens pour une rigidité et un pop maximaux sur cet axe. Le carbone biax (biaxial) oriente les fibres selon deux angles pour la rigidité en torsion et un flex plus contrôlé et amorti. Nous combinons les deux pour régler la rigidité et le ressenti exactement là où chaque board en a besoin.'],
      ['design', 'Comment le rocker de la Rocket est-il calculé ?',
        'La ligne de rocker est développée et affinée par le prototypage et les tests sur l’eau, et non copiée d’un gabarit. Nous équilibrons le pop, la mise au planning rapide et le contrôle pour que la courbe emmagasine et restitue l’énergie précisément au moment voulu pour des sauts explosifs.'],
      ['design', 'Qu’est-ce que l’infusion sous vide ?',
        'L’infusion sous vide est une méthode de fabrication où la résine est aspirée à travers le carbone sec et le noyau sous l’effet du vide. Elle produit un stratifié homogène, sans bulles, avec un rapport résine/fibre optimal — d’où une board plus légère, plus solide et plus régulière qu’avec un stratifié à la main.'],
      ['design', 'Combien de temps faut-il pour fabriquer une board TK à la main ?',
        'Une seule board passe par de nombreuses étapes — façonnage du noyau, stratification du carbone, infusion sous vide, cuisson, ponçage et finition — réparties sur plusieurs jours. Une grande partie de ce temps est consacrée à la cuisson et à la finition manuelle minutieuse, c’est pourquoi chaque board est produite en petite quantité plutôt qu’en série.'],

      // ENTRETIEN
      ['maintenance', 'Comment entretenir ma board TK ?',
        'Rincez la board à l’eau douce après chaque session pour éliminer le sel et le sable, puis laissez-la sécher à l’ombre avant de la ranger. Évitez de la laisser au soleil direct ou dans une voiture surchauffée pendant de longues périodes, car une chaleur prolongée peut fragiliser le stratifié.'],
      ['maintenance', 'Comment ranger ma board entre les sessions ?',
        'Rangez la board à plat ou sur la tranche dans un endroit frais et sec, à l’abri du soleil direct, idéalement dans une housse rembourrée. Tenez-la éloignée des sources de chaleur et évitez d’empiler des objets lourds dessus afin de protéger le pont et les rails.'],
      ['maintenance', 'Puis-je réparer un impact moi-même ?',
        'Les petites rayures de surface sont esthétiques et sans gravité. Tout impact qui traverse le stratifié doit être séché et scellé rapidement pour empêcher l’eau d’atteindre le noyau — pour les réparations structurelles, nous recommandons de nous l’envoyer ou de la confier à un réparateur de confiance afin de préserver la garantie.'],
      ['maintenance', 'Comment entretenir les ailerons et leurs boîtiers ?',
        'Rincez les ailerons et les boîtiers à l’eau douce après chaque session et vérifiez régulièrement les vis. Retirez le sable des boîtiers avant de remonter les ailerons, ne serrez pas trop les vis et rangez les ailerons séparément pour éviter de les tordre ou de les ébrécher.'],

      // GARANTIE
      ['warranty', 'Que couvre la garantie TK ?',
        'Chaque board TK est garantie contre les défauts de fabrication, de matériaux et de main-d’œuvre pendant la durée de garantie indiquée à l’achat. Elle ne couvre pas l’usure normale, les dommages dus aux chocs, ni les dommages liés à une mauvaise utilisation, à un stockage inadapté ou à des réparations effectuées par des tiers.'],
      ['warranty', 'Comment faire jouer la garantie ?',
        'Contactez-nous avec les détails de votre commande et des photos nettes du problème. Nous évaluerons la demande et, si elle est couverte, nous réparerons ou remplacerons la board. Conservez votre preuve d’achat, indispensable pour toute demande.'],
      ['warranty', 'Quelle est votre politique de retour ?',
        'Les boards en stock peuvent être retournées dans le délai et l’état prévus par nos conditions, à condition d’être inutilisées et dans leur emballage d’origine. Les boards sur mesure et fabriquées à la commande sont réalisées selon vos spécifications et ne peuvent être retournées, sauf en cas de défaut.'],
    ],
  },

  es: {
    title: 'Preguntas frecuentes',
    intro: 'Todo lo que necesitas saber sobre las boards TK: cómo navegan, cómo se fabrican y cómo cuidarlas.',
    cat: { general: 'GENERAL', design: 'DISEÑO Y CONSTRUCCIÓN', maintenance: 'MANTENIMIENTO', warranty: 'GARANTÍA' },
    items: [
      // GENERAL
      ['general', '¿En qué se diferencia la Rocket de una surf board?',
        'La Rocket es una board de kitesurf direccional, no una tabla de surf. Está hecha específicamente para navegar con cometa: la forma, el laminado de carbono rígido y el rocker agresivo están afinados para lograr el máximo pop, precisión y control bajo tracción, no para remar hacia las olas.'],
      ['general', '¿Es la Rocket adecuada para principiantes?',
        'Sinceramente, no. La Rocket es una board direccional pensada para riders que ya saben lo que quieren de una tabla. Un twin-tip perdona mucho más al aprender lo básico; la Rocket recompensa la experiencia con precisión y agresividad.'],
      ['general', '¿Qué tallas hay disponibles y cómo elijo la adecuada?',
        'Cada modelo está disponible en varias longitudes según el peso del rider, su nivel y las condiciones. Por norma general, los riders ligeros y los vientos fuertes piden tallas más pequeñas, mientras que los riders más pesados y los vientos flojos piden tallas mayores. Si tienes dudas, escríbenos con tu peso y tu estilo y te recomendaremos la talla correcta.'],
      ['general', '¿Ofrece TK boards a medida?',
        'Sí. Como cada board se fabrica a mano en nuestro propio taller, podemos adaptar las dimensiones, el flex y el acabado a tu peso y tu estilo de navegación. Ponte en contacto para iniciar una fabricación a medida; los plazos son algo más largos que los de las boards en stock.'],
      ['general', '¿Dónde se fabrican las boards TK?',
        'Cada board TK se diseña y se fabrica a mano en nuestro propio taller. Controlamos todo el proceso internamente, desde el moldeado del núcleo de paulownia hasta el laminado de carbono y la infusión al vacío, de modo que nada sale de nuestras manos antes de cumplir con nuestro nivel de exigencia.'],
      ['general', '¿Cuál es el plazo de entrega tras realizar el pedido?',
        'Las boards en stock suelen enviarse en una o dos semanas. Las boards a medida y bajo pedido tardan más, porque cada una se fabrica a mano según tus especificaciones; te confirmaremos un plazo exacto al hacer el pedido.'],
      ['general', '¿Ofrecéis sesiones de prueba antes de comprar?',
        'Sí, siempre que es posible. Creemos que una board hay que sentirla antes de comprarla, por eso organizamos sesiones de prueba y acudimos a determinados eventos. Contáctanos para saber dónde puedes probar una board TK cerca de ti.'],

      // DISEÑO Y CONSTRUCCIÓN
      ['design', '¿Por qué elegís la paulownia como material del núcleo?',
        'La paulownia es ligera, resistente y naturalmente hidrófuga, con una excelente relación rigidez/peso. Aporta a la board un tacto vivo y reactivo y una larga vida útil, y al ser una madera renovable de crecimiento rápido es una opción más sostenible que los núcleos de espuma.'],
      ['design', '¿Cuál es la diferencia entre un laminado de carbono UD y biax?',
        'El carbono UD (unidireccional) orienta todas sus fibras en un solo sentido para lograr la máxima rigidez y pop en ese eje. El carbono biax (biaxial) orienta las fibras en dos ángulos para dar rigidez a la torsión y un flex más controlado y amortiguado. Combinamos ambos para ajustar la rigidez y el tacto exactamente donde cada board lo necesita.'],
      ['design', '¿Cómo se calcula el rocker de la Rocket?',
        'La línea de rocker se desarrolla y se afina mediante prototipos y pruebas en el agua, no se copia de una plantilla. Equilibramos el pop, el planeo temprano y el control para que la curva cargue y libere la energía justo cuando la necesitas para saltos explosivos.'],
      ['design', '¿Qué es la infusión al vacío?',
        'La infusión al vacío es un método de fabricación en el que la resina se introduce a través del carbono seco y el núcleo mediante presión de vacío. Produce un laminado uniforme y sin burbujas, con la proporción óptima de resina y fibra, lo que se traduce en una board más ligera, resistente y consistente que con un laminado manual.'],
      ['design', '¿Cuánto se tarda en fabricar a mano una board TK?',
        'Una sola board pasa por muchas fases —moldeado del núcleo, laminado del carbono, infusión al vacío, curado, lijado y acabado— repartidas en varios días. Buena parte de ese tiempo es curado y acabado manual minucioso, por eso cada board se fabrica en pequeñas cantidades en lugar de en serie.'],

      // MANTENIMIENTO
      ['maintenance', '¿Cómo cuido mi board TK?',
        'Enjuaga la board con agua dulce después de cada sesión para eliminar la sal y la arena, y déjala secar a la sombra antes de guardarla. Evita dejarla al sol directo o en un coche caliente durante mucho tiempo, ya que el calor prolongado puede dañar el laminado.'],
      ['maintenance', '¿Cómo debo guardar la board entre sesiones?',
        'Guarda la board en plano o sobre el canto en un lugar fresco y seco, lejos de la luz solar directa, idealmente en una funda acolchada. Mantenla alejada de fuentes de calor y evita apilar objetos pesados encima para proteger la cubierta y los cantos.'],
      ['maintenance', '¿Puedo reparar un golpe yo mismo?',
        'Los pequeños arañazos superficiales son estéticos e inofensivos. Cualquier golpe que atraviese el laminado debe secarse y sellarse de inmediato para evitar que el agua llegue al núcleo; para reparaciones estructurales recomendamos enviárnosla o llevarla a un reparador de confianza para mantener la garantía.'],
      ['maintenance', '¿Cómo cuido las quillas y sus cajetines?',
        'Enjuaga las quillas y los cajetines con agua dulce después de cada sesión y revisa los tornillos con regularidad. Quita la arena de los cajetines antes de volver a montarlas, no aprietes los tornillos en exceso y guarda las quillas por separado para evitar que se doblen o astillen.'],

      // GARANTÍA
      ['warranty', '¿Qué cubre la garantía de TK?',
        'Cada board TK está cubierta frente a defectos de fabricación en materiales y mano de obra durante el periodo de garantía indicado en la compra. No cubre el desgaste normal, los daños por impacto ni los daños derivados de un uso indebido, un almacenamiento inadecuado o reparaciones realizadas por terceros.'],
      ['warranty', '¿Cómo reclamo la garantía?',
        'Contáctanos con los datos de tu pedido y fotos claras del problema. Evaluaremos la reclamación y, si está cubierta, repararemos o sustituiremos la board. Conserva tu comprobante de compra, ya que es necesario para cualquier reclamación.'],
      ['warranty', '¿Cuál es vuestra política de devoluciones?',
        'Las boards en stock pueden devolverse dentro del plazo y en el estado que establecen nuestras condiciones, siempre que estén sin usar y en su embalaje original. Las boards a medida y bajo pedido se fabrican según tus especificaciones y no admiten devolución salvo defecto.'],
    ],
  },
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!token) {
    console.error('✗ Missing SANITY_API_WRITE_TOKEN in .env.local')
    process.exit(1)
  }

  const client = createClient({ projectId, dataset, apiVersion: '2025-05-25', token, useCdn: false })

  for (const lang of ['en', 'fr', 'es']) {
    const c = content[lang]
    const doc = await client.fetch(
      `*[_type=="faqPage" && language==$lang && !(_id in path("drafts.**"))][0]{_id}`,
      { lang },
    )
    if (!doc?._id) {
      console.error(`✗ [${lang}] No published faqPage doc found — skipping.`)
      continue
    }

    const items = c.items.map(([catKey, q, a]) => item(c.cat[catKey], q, a))

    // Sanity check: _keys must be unique within the array.
    const keys = new Set(items.map((i) => i._key))
    if (keys.size !== items.length) {
      console.error(`✗ [${lang}] Duplicate _key detected — aborting.`)
      process.exit(1)
    }

    await client.patch(doc._id).set({ title: c.title, intro: c.intro, items }).commit()

    const byCat = {}
    for (const i of items) byCat[i.category] = (byCat[i.category] || 0) + 1
    console.log(`✓ [${lang}] ${doc._id} — ${items.length} items:`, JSON.stringify(byCat))
  }

  console.log('Done. Page updates after cache revalidation (sanityCache revalidate 3600 / webhook).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
