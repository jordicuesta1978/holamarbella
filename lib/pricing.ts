import { getPriceRanges, getVolumeDiscounts } from './db'
import { EMAIL_LABELS, nightWord, type EmailLocale } from './email-i18n'

export type NightBreakdown = { price: number; count: number }
export type VolumeDiscountRule = { start: string; end: string; minNights: number; percentage: number }
export type VolumeDiscountMatch = { percentage: number; amount: number }

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

// Picks the best-matching volume-discount rule for a stay: the rule's date
// range must contain the check-in date (same convention as minimum_nights),
// and the stay must have at least the rule's minimum nights. When several
// rules match, the one with the highest percentage wins.
export function computeVolumeDiscount(
  rules: VolumeDiscountRule[],
  checkIn: string,
  nights: number,
  subtotal: number,
): VolumeDiscountMatch | null {
  if (!checkIn || nights <= 0 || subtotal <= 0) return null
  const matches = rules.filter(r => checkIn >= r.start && checkIn < r.end && nights >= r.minNights)
  if (matches.length === 0) return null
  const best = matches.reduce((a, b) => (b.percentage > a.percentage ? b : a))
  return { percentage: best.percentage, amount: Math.round(subtotal * best.percentage / 100) }
}

// Recomputes the volume discount for an email breakdown directly from the
// descuentos_volumen table (same pattern as computeNightlyBreakdown).
export async function computeVolumeDiscountForStay(
  apartmentSlug: string,
  checkIn: string,
  nights: number,
  subtotal: number,
): Promise<VolumeDiscountMatch | null> {
  if (!checkIn || nights <= 0) return null
  const rules = await getVolumeDiscounts(apartmentSlug)
  return computeVolumeDiscount(rules, checkIn, nights, subtotal)
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
  discount?: VolumeDiscountMatch | null
}): string {
  const { breakdown, base, nights, cleaningFee, extras, total, locale = 'es', discount } = opts
  const t = EMAIL_LABELS[locale]
  const breakdownTotal = breakdown.reduce((s, g) => s + g.price * g.count, 0)

  const tdL = `style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;border-top:1px solid #e8e0d0;"`
  const tdR = `style="padding:8px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #e8e0d0;text-align:right;"`
  const tdRBold = `style="padding:10px 16px;font-size:14px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;text-align:right;"`
  const tdLBold = `style="padding:10px 16px;background:#f9f7f4;font-size:13px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;"`

  // Only show the discount as its own line when it fully reconstructs the
  // saved base (breakdown − discount === base) — otherwise the admin manually
  // overrode the price and we fall back to a single "Alojamiento" line, same
  // rule as the plain tramos reconciliation.
  const tiersWithDiscountReconcile = breakdown.length > 0 && !!discount && (breakdownTotal - discount.amount === base)
  const tiersOnlyReconcile = !tiersWithDiscountReconcile && breakdown.length > 1 && breakdownTotal === base

  let lodgingRows: string
  if (tiersWithDiscountReconcile || tiersOnlyReconcile) {
    lodgingRows = breakdown.map((g, i) =>
      `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;${i > 0 ? 'border-top:1px solid #e8e0d0;' : ''}">${g.price}€/${locale === 'en' ? 'night' : 'noche'} × ${g.count} ${nightWord(g.count, locale)}</td><td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;${i > 0 ? 'border-top:1px solid #e8e0d0;' : ''}">${g.price * g.count}€</td></tr>`
    ).join('')
  } else {
    lodgingRows = `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;">${t.lodging}${nights > 0 ? ` · ${nights} ${nightWord(nights, locale)}` : ''}</td><td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;">${base}€</td></tr>`
  }

  const discountLabel = locale === 'en' ? 'Long-stay discount' : 'Descuento estancia larga'
  const discountRow = tiersWithDiscountReconcile && discount
    ? `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#4B766B;border-top:1px solid #e8e0d0;">${discountLabel} (-${discount.percentage}%)</td><td style="padding:8px 16px;font-size:13px;color:#4B766B;border-top:1px solid #e8e0d0;text-align:right;">-${discount.amount}€</td></tr>`
    : ''

  const extraRows = extras.map(e => {
    const qty = e.quantity && e.quantity > 1 ? ` · ${e.quantity} ${e.unit ?? 'uds'}` : ''
    return `<tr><td ${tdL}>${e.name}${qty}</td><td ${tdR}>${e.amount * (e.quantity ?? 1)}€</td></tr>`
  }).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin:20px 0 24px;">
    ${lodgingRows}
    ${discountRow}
    ${cleaningFee > 0 ? `<tr><td ${tdL}>${t.cleaningFee}</td><td ${tdR}>${cleaningFee}€</td></tr>` : ''}
    ${extraRows}
    <tr><td ${tdLBold}>${t.total}</td><td ${tdRBold}>${total}€</td></tr>
  </table>`
}
