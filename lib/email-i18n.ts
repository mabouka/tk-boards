// Email copy is rendered outside the next-intl request context (via render()),
// so emails carry their own small translation table keyed by the user's locale.

export type EmailLocale = 'fr' | 'en' | 'es'

type EmailStrings = {
  verifySubject: string
  verifyPreheader: string
  verifyHeading: string
  verifyBody: string
  verifyCta: string
  resetSubject: string
  resetPreheader: string
  resetHeading: string
  resetBody: string
  resetBody2: string
  resetCta: string
  foundSubject: string
  foundPreheader: string
  foundHeading: string
  foundBody: string
  foundMessageLabel: string
  foundReplyLabel: string
  foundPhoneLabel: string
  foundCta: string
  foundSerialLabel: string
  transferSubject: string
  transferPreheader: string
  transferHeading: string
  transferBody: string
  transferCta: string
  orderSubject: string
  orderPreheader: string
  orderHeading: string
  orderBody: string
  orderSubtotal: string
  orderTax: string
  orderShipping: string
  orderTotal: string
  orderShipTo: string
  orderCta: string
  shipSubject: string
  shipPreheader: string
  shipHeading: string
  shipBody: string
  shipCarrierLabel: string
  shipTrackingLabel: string
  shipCta: string
  shipCtaFallback: string
  fallback: string
  footer: string
  footer2: string
}

const emailCopy: Record<EmailLocale, EmailStrings> = {
  fr: {
    verifySubject: 'Confirme ton adresse email — TK Boards',
    verifyPreheader: 'Confirme ton email pour activer ton TK ID.',
    verifyHeading: 'Confirme ton email',
    verifyBody:
      'Bienvenue chez TK Boards. Confirme ton adresse pour activer ton TK ID. Ce lien expire dans 24 heures.',
    verifyCta: 'Vérifier mon email',
    resetSubject: 'Réinitialise ton mot de passe — TK Boards',
    resetPreheader: 'Réinitialise le mot de passe de ton TK ID.',
    resetHeading: 'Nouveau mot de passe',
    resetBody: 'Tu as demandé à réinitialiser ton mot de passe.',
    resetBody2:
      "Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet email.",
    resetCta: 'Choisir un nouveau mot de passe',
    foundSubject: "Quelqu'un a retrouvé ta planche — TK Boards",
    foundPreheader: "Un message t'attend via ton TK ID.",
    foundHeading: "Quelqu'un a retrouvé ta planche",
    foundBody: "Quelqu'un a scanné le tag TK ID de ta planche et t'a laissé un message",
    foundMessageLabel: 'Message',
    foundReplyLabel: 'Répondre à',
    foundPhoneLabel: 'Téléphone',
    foundCta: 'Voir ma planche',
    foundSerialLabel: 'Série',
    transferSubject: 'On te transfère une planche TK ID — TK Boards',
    transferPreheader: 'Accepte le transfert de ta planche.',
    transferHeading: 'Une planche pour toi',
    transferBody:
      "Quelqu'un souhaite te transférer la propriété de cette planche TK ID. Connecte-toi (ou crée ton compte avec cet email), puis accepte le transfert. Ce lien expire dans 7 jours.",
    transferCta: 'Accepter le transfert',
    orderSubject: 'Merci pour ta commande — TK Boards',
    orderPreheader: 'On a bien reçu ta commande.',
    orderHeading: 'Commande confirmée',
    orderBody: 'Merci ! Voici le récapitulatif de ta commande. Tu recevras un email dès son expédition.',
    orderSubtotal: 'Sous-total',
    orderTax: 'TVA',
    orderShipping: 'Livraison',
    orderTotal: 'Total',
    orderShipTo: 'Livraison à',
    orderCta: 'Voir ma commande',
    shipSubject: 'Ta commande est en route — TK Boards',
    shipPreheader: 'Ta commande a été expédiée.',
    shipHeading: 'Commande expédiée',
    shipBody: 'Bonne nouvelle — ta commande est en route. Voici les infos de suivi.',
    shipCarrierLabel: 'Transporteur',
    shipTrackingLabel: 'N° de suivi',
    shipCta: 'Suivre mon colis',
    shipCtaFallback: 'Voir ma commande',
    fallback: 'Le bouton ne marche pas ? Copie ce lien :',
    footer: 'Tu reçois cet email suite à une action sur ton compte TK ID.',
    footer2: "Si ce n'était pas toi, ignore-le simplement.",
  },
  en: {
    verifySubject: 'Confirm your email — TK Boards',
    verifyPreheader: 'Confirm your email to activate your TK ID.',
    verifyHeading: 'Confirm your email',
    verifyBody:
      'Welcome to TK Boards. Confirm your address to activate your TK ID. This link expires in 24 hours.',
    verifyCta: 'Verify my email',
    resetSubject: 'Reset your password — TK Boards',
    resetPreheader: 'Reset your TK ID password.',
    resetHeading: 'New password',
    resetBody: 'You requested a password reset.',
    resetBody2:
      "This link expires in 1 hour. If you didn't request it, just ignore this email.",
    resetCta: 'Choose a new password',
    foundSubject: 'Someone found your board — TK Boards',
    foundPreheader: 'A message is waiting via your TK ID.',
    foundHeading: 'Someone found your board',
    foundBody: "Someone scanned your board's TK ID tag and left you a message",
    foundMessageLabel: 'Message',
    foundReplyLabel: 'Reply to',
    foundPhoneLabel: 'Phone',
    foundCta: 'View my board',
    foundSerialLabel: 'Serial',
    transferSubject: 'A TK board is being transferred to you — TK Boards',
    transferPreheader: 'Accept the transfer of your board.',
    transferHeading: 'A board for you',
    transferBody:
      'Someone wants to transfer ownership of this TK ID board to you. Sign in (or create your account with this email), then accept the transfer. This link expires in 7 days.',
    transferCta: 'Accept the transfer',
    orderSubject: 'Thanks for your order — TK Boards',
    orderPreheader: 'We received your order.',
    orderHeading: 'Order confirmed',
    orderBody: "Thank you! Here's a summary of your order. We'll email you as soon as it ships.",
    orderSubtotal: 'Subtotal',
    orderTax: 'VAT',
    orderShipping: 'Shipping',
    orderTotal: 'Total',
    orderShipTo: 'Ship to',
    orderCta: 'View my order',
    shipSubject: 'Your order is on its way — TK Boards',
    shipPreheader: 'Your order has shipped.',
    shipHeading: 'Order shipped',
    shipBody: 'Good news — your order is on its way. Here are the tracking details.',
    shipCarrierLabel: 'Carrier',
    shipTrackingLabel: 'Tracking no.',
    shipCta: 'Track my parcel',
    shipCtaFallback: 'View my order',
    fallback: 'Button not working? Copy this link:',
    footer: "You're receiving this email following an action on your TK ID account.",
    footer2: "If this wasn't you, just ignore it.",
  },
  es: {
    verifySubject: 'Confirma tu correo — TK Boards',
    verifyPreheader: 'Confirma tu correo para activar tu TK ID.',
    verifyHeading: 'Confirma tu correo',
    verifyBody:
      'Bienvenido a TK Boards. Confirma tu dirección para activar tu TK ID. Este enlace caduca en 24 horas.',
    verifyCta: 'Verificar mi correo',
    resetSubject: 'Restablece tu contraseña — TK Boards',
    resetPreheader: 'Restablece la contraseña de tu TK ID.',
    resetHeading: 'Nueva contraseña',
    resetBody: 'Solicitaste restablecer tu contraseña.',
    resetBody2: 'Este enlace caduca en 1 hora. Si no fuiste tú, ignora este correo.',
    resetCta: 'Elegir una nueva contraseña',
    foundSubject: 'Alguien encontró tu tabla — TK Boards',
    foundPreheader: 'Tienes un mensaje a través de tu TK ID.',
    foundHeading: 'Alguien encontró tu tabla',
    foundBody: 'Alguien escaneó la etiqueta TK ID de tu tabla y te dejó un mensaje',
    foundMessageLabel: 'Mensaje',
    foundReplyLabel: 'Responder a',
    foundPhoneLabel: 'Teléfono',
    foundCta: 'Ver mi tabla',
    foundSerialLabel: 'Serie',
    transferSubject: 'Te transfieren una tabla TK ID — TK Boards',
    transferPreheader: 'Acepta la transferencia de tu tabla.',
    transferHeading: 'Una tabla para ti',
    transferBody:
      'Alguien quiere transferirte la propiedad de esta tabla TK ID. Inicia sesión (o crea tu cuenta con este email) y acepta la transferencia. Este enlace caduca en 7 días.',
    transferCta: 'Aceptar la transferencia',
    orderSubject: 'Gracias por tu pedido — TK Boards',
    orderPreheader: 'Hemos recibido tu pedido.',
    orderHeading: 'Pedido confirmado',
    orderBody: '¡Gracias! Aquí tienes el resumen de tu pedido. Te avisaremos por email en cuanto se envíe.',
    orderSubtotal: 'Subtotal',
    orderTax: 'IVA',
    orderShipping: 'Envío',
    orderTotal: 'Total',
    orderShipTo: 'Enviar a',
    orderCta: 'Ver mi pedido',
    shipSubject: 'Tu pedido está en camino — TK Boards',
    shipPreheader: 'Tu pedido ha sido enviado.',
    shipHeading: 'Pedido enviado',
    shipBody: 'Buenas noticias: tu pedido está en camino. Aquí tienes los datos de seguimiento.',
    shipCarrierLabel: 'Transportista',
    shipTrackingLabel: 'Nº de seguimiento',
    shipCta: 'Seguir mi paquete',
    shipCtaFallback: 'Ver mi pedido',
    fallback: '¿El botón no funciona? Copia este enlace:',
    footer: 'Recibes este correo tras una acción en tu cuenta TK ID.',
    footer2: 'Si no fuiste tú, ignóralo.',
  },
}

export function emailT(locale: string): EmailStrings {
  const l = (['fr', 'en', 'es'].includes(locale) ? locale : 'en') as EmailLocale
  return emailCopy[l]
}
