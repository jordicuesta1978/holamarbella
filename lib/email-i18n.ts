export type EmailLocale = 'es' | 'en'

export function fmtEmailDate(d: string | null | undefined, locale: EmailLocale): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString(locale === 'en' ? 'en-GB' : 'es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export function nightWord(n: number, locale: EmailLocale): string {
  if (locale === 'en') return n === 1 ? 'night' : 'nights'
  return n === 1 ? 'noche' : 'noches'
}

export function guestWord(n: number, locale: EmailLocale): string {
  if (locale === 'en') return n === 1 ? 'guest' : 'guests'
  return n === 1 ? 'persona' : 'personas'
}

export const EMAIL_LABELS: Record<EmailLocale, {
  apartment: string
  reference: string
  checkIn: string
  checkOut: string
  guests: string
  yourMessage: string
  estimatedPrice: string
  estimatedTotal: string
  priceFootnote: string
  cleaningFee: string
  lodging: string
  total: string
  depositPaid: string
  balanceDue: string
  paymentMethods: string
  bankTransfer: string
  replyPrompt: string
}> = {
  es: {
    apartment: 'Apartamento',
    reference: 'Referencia',
    checkIn: 'Llegada',
    checkOut: 'Salida',
    guests: 'Personas',
    yourMessage: 'Tu mensaje',
    estimatedPrice: 'Precio estimado',
    estimatedTotal: 'Total estimado',
    priceFootnote: '* El precio exacto será confirmado al revisar tu solicitud.',
    cleaningFee: 'Gastos de limpieza',
    lodging: 'Alojamiento',
    total: 'Total',
    depositPaid: 'Anticipo pagado',
    balanceDue: 'Pendiente',
    paymentMethods: 'Formas de pago',
    bankTransfer: 'Transferencia bancaria',
    replyPrompt: '¿Tienes dudas? Responde directamente a este email.',
  },
  en: {
    apartment: 'Apartment',
    reference: 'Reference',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    yourMessage: 'Your message',
    estimatedPrice: 'Estimated price',
    estimatedTotal: 'Estimated total',
    priceFootnote: '* The exact price will be confirmed once we review your request.',
    cleaningFee: 'Cleaning fee',
    lodging: 'Lodging',
    total: 'Total',
    depositPaid: 'Deposit paid',
    balanceDue: 'Balance due',
    paymentMethods: 'Payment methods',
    bankTransfer: 'Bank transfer',
    replyPrompt: 'Have any questions? Just reply to this email.',
  },
}
