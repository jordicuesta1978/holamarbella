import { getPriceRanges } from './db'
import { EMAIL_LABELS, nightWord, type EmailLocale } from './email-i18n'

export type NightBreakdown = { price: number; count: number }

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Same logic as PricingPanel/CalendarPicker/ReservarContent — recomputes the
// per-tier nightly breakdown from the current precios table for a given stay.
export async function computeNightlyBreakdown(
  apartmentSlug: string,
  checkIn: string,
  checkOut: string,
  midPrice: number,
): Promise<NightBreakdown[]> {
  if (!checkIn || !checkOut) return []
  const priceRanges = await getPriceRanges(apartmentSlug)

  const nights: number[] = []
  const s = new Date(checkIn + 'T00:00:00')
  const e = new Date(checkOut + 'T00:00:00')
  for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const key = toKey(d)
    let range: { start: string; end: string; price: number } | undefined
    for (const p of priceRanges) {
      if (key >= p.start && key < p.end) range = p
    }
    nights.push(range?.price ?? midPrice)
  }

  const breakdown: NightBreakdown[] = []
  for (const p of nights) {
    const last = breakdown[breakdown.length - 1]
    if (last && last.price === p) last.count++
    else breakdown.push({ price: p, count: 1 })
  }
  return breakdown
}

type ExtraLine = { name: string; amount: number; quantity?: number; unit?: string }

// Renders the "Alojamiento / Gastos de limpieza / Extras / Total" table used in
// the quote and confirmed-reservation emails. Shows the per-tier nightly
// breakdown when it reconstructs the saved base amount exactly (i.e. nobody
// manually overrode the price); otherwise falls back to a single line with
// the saved base — same rule PricingPanel uses to decide what to display.
export function renderPricingTable(opts: {
  breakdown: NightBreakdown[]
  base: number
  nights: number
  cleaningFee: number
  extras: ExtraLine[]
  total: number
  locale?: EmailLocale
}): string {
  const { breakdown, base, nights, cleaningFee, extras, total, locale = 'es' } = opts
  const t = EMAIL_LABELS[locale]
  const breakdownTotal = breakdown.reduce((s, g) => s + g.price * g.count, 0)

  const tdL = `style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;border-top:1px solid #e8e0d0;"`
  const tdR = `style="padding:8px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #e8e0d0;text-align:right;"`
  const tdRBold = `style="padding:10px 16px;font-size:14px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;text-align:right;"`
  const tdLBold = `style="padding:10px 16px;background:#f9f7f4;font-size:13px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;"`

  let lodgingRows: string
  if (breakdown.length > 1 && breakdownTotal === base) {
    lodgingRows = breakdown.map((g, i) =>
      `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;${i > 0 ? 'border-top:1px solid #e8e0d0;' : ''}">${g.price}€/${locale === 'en' ? 'night' : 'noche'} × ${g.count} ${nightWord(g.count, locale)}</td><td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;${i > 0 ? 'border-top:1px solid #e8e0d0;' : ''}">${g.price * g.count}€</td></tr>`
    ).join('')
  } else {
    lodgingRows = `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;">${t.lodging}${nights > 0 ? ` · ${nights} ${nightWord(nights, locale)}` : ''}</td><td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;">${base}€</td></tr>`
  }

  const extraRows = extras.map(e => {
    const qty = e.quantity && e.quantity > 1 ? ` · ${e.quantity} ${e.unit ?? 'uds'}` : ''
    return `<tr><td ${tdL}>${e.name}${qty}</td><td ${tdR}>${e.amount * (e.quantity ?? 1)}€</td></tr>`
  }).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin:20px 0 24px;">
    ${lodgingRows}
    ${cleaningFee > 0 ? `<tr><td ${tdL}>${t.cleaningFee}</td><td ${tdR}>${cleaningFee}€</td></tr>` : ''}
    ${extraRows}
    <tr><td ${tdLBold}>${t.total}</td><td ${tdRBold}>${total}€</td></tr>
  </table>`
}
