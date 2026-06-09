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
    fallback: '¿El botón no funciona? Copia este enlace:',
    footer: 'Recibes este correo tras una acción en tu cuenta TK ID.',
    footer2: 'Si no fuiste tú, ignóralo.',
  },
}

export function emailT(locale: string): EmailStrings {
  const l = (['fr', 'en', 'es'].includes(locale) ? locale : 'en') as EmailLocale
  return emailCopy[l]
}
