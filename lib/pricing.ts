import { getPriceRanges, getVolumeDiscounts } from './db'
import { EMAIL_LABELS, nightWord, type EmailLocale } from './email-i18n'

export type NightBreakdown = { price: number; count: number }
export type VolumeDiscountRule = { start: string; end: string; minNights: number; percentage: number; name?: string | null }
export type VolumeDiscountLine = { label: string; percentage: number; amount: number }

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Same logic as PricingPanel/CalendarPicker/ReservarContent — recomputes the
// per-night prices from the current precios table for a given stay.
export async function computeNightlyPrices(
  apartmentSlug: string,
  checkIn: string,
  checkOut: string,
  midPrice: number,
): Promise<Array<{ date: string; price: number }>> {
  if (!checkIn || !checkOut) return []
  const priceRanges = await getPriceRanges(apartmentSlug)

  const nights: Array<{ date: string; price: number }> = []
  const s = new Date(checkIn + 'T00:00:00')
  const e = new Date(checkOut + 'T00:00:00')
  for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const key = toKey(d)
    let range: { start: string; end: string; price: number } | undefined
    for (const p of priceRanges) {
      if (key >= p.start && key < p.end) range = p
    }
    nights.push({ date: key, price: range?.price ?? midPrice })
  }
  return nights
}

export async function computeNightlyBreakdown(
  apartmentSlug: string,
  checkIn: string,
  checkOut: string,
  midPrice: number,
): Promise<NightBreakdown[]> {
  const nights = await computeNightlyPrices(apartmentSlug, checkIn, checkOut, midPrice)
  const breakdown: NightBreakdown[] = []
  for (const n of nights) {
    const last = breakdown[breakdown.length - 1]
    if (last && last.price === n.price) last.count++
    else breakdown.push({ price: n.price, count: 1 })
  }
  return breakdown
}

// Computes volume discounts prorated per night: a rule is "active" for the
// stay when the total number of nights meets its minimum; each night that
// falls within an active rule's date range is discounted at that rule's
// percentage (highest wins if more than one active rule covers a night).
// Returns one line per rule that actually discounted at least one night, so
// a stay crossing two different-rate periods shows both as separate lines.
export function computeVolumeDiscounts(
  rules: VolumeDiscountRule[],
  nights: Array<{ date: string; price: number }>,
): VolumeDiscountLine[] {
  if (nights.length === 0) return []
  const activeRules = rules.filter(r => nights.length >= r.minNights)
  if (activeRules.length === 0) return []

  const groups = new Map<string, { rule: VolumeDiscountRule; rawAmount: number }>()
  for (const n of nights) {
    const matches = activeRules.filter(r => n.date >= r.start && n.date < r.end)
    if (matches.length === 0) continue
    const rule = matches.reduce((a, b) => (b.percentage > a.percentage ? b : a))
    const key = `${rule.start}|${rule.end}|${rule.percentage}|${rule.name ?? ''}`
    const raw = n.price * rule.percentage / 100
    const existing = groups.get(key)
    if (existing) existing.rawAmount += raw
    else groups.set(key, { rule, rawAmount: raw })
  }

  return Array.from(groups.values()).map(({ rule, rawAmount }) => ({
    label: rule.name?.trim() || '',
    percentage: rule.percentage,
    amount: Math.round(rawAmount),
  }))
}

// Recomputes the volume discounts for an email/admin breakdown directly from
// the descuentos_volumen table (same pattern as computeNightlyBreakdown).
export async function computeVolumeDiscountsForStay(
  apartmentSlug: string,
  checkIn: string,
  checkOut: string,
  midPrice: number,
): Promise<VolumeDiscountLine[]> {
  const [rules, nights] = await Promise.all([
    getVolumeDiscounts(apartmentSlug),
    computeNightlyPrices(apartmentSlug, checkIn, checkOut, midPrice),
  ])
  return computeVolumeDiscounts(rules, nights)
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
  discounts?: VolumeDiscountLine[]
}): string {
  const { breakdown, base, nights, cleaningFee, extras, total, locale = 'es', discounts = [] } = opts
  const t = EMAIL_LABELS[locale]
  const breakdownTotal = breakdown.reduce((s, g) => s + g.price * g.count, 0)
  const discountsTotal = discounts.reduce((s, d) => s + d.amount, 0)

  const tdL = `style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;border-top:1px solid #e8e0d0;"`
  const tdR = `style="padding:8px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #e8e0d0;text-align:right;"`
  const tdRBold = `style="padding:10px 16px;font-size:14px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;text-align:right;"`
  const tdLBold = `style="padding:10px 16px;background:#f9f7f4;font-size:13px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;"`

  // Only show the discount lines when they fully reconstruct the saved base
  // (breakdown − discounts === base) — otherwise the admin manually overrode
  // the price and we fall back to a single "Alojamiento" line, same rule as
  // the plain tramos reconciliation.
  const tiersWithDiscountReconcile = breakdown.length > 0 && discounts.length > 0 && (breakdownTotal - discountsTotal === base)
  const tiersOnlyReconcile = !tiersWithDiscountReconcile && breakdown.length > 1 && breakdownTotal === base

  let lodgingRows: string
  if (tiersWithDiscountReconcile || tiersOnlyReconcile) {
    lodgingRows = breakdown.map((g, i) =>
      `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;${i > 0 ? 'border-top:1px solid #e8e0d0;' : ''}">${g.price}€/${locale === 'en' ? 'night' : 'noche'} × ${g.count} ${nightWord(g.count, locale)}</td><td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;${i > 0 ? 'border-top:1px solid #e8e0d0;' : ''}">${g.price * g.count}€</td></tr>`
    ).join('')
  } else {
    lodgingRows = `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;">${t.lodging}${nights > 0 ? ` · ${nights} ${nightWord(nights, locale)}` : ''}</td><td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;">${base}€</td></tr>`
  }

  const defaultDiscountLabel = locale === 'en' ? 'Long-stay discount' : 'Descuento estancia larga'
  const discountRows = tiersWithDiscountReconcile
    ? discounts.map(d =>
        `<tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#4B766B;border-top:1px solid #e8e0d0;">${d.label || defaultDiscountLabel} (-${d.percentage}%)</td><td style="padding:8px 16px;font-size:13px;color:#4B766B;border-top:1px solid #e8e0d0;text-align:right;">-${d.amount}€</td></tr>`
      ).join('')
    : ''

  const extraRows = extras.map(e => {
    const qty = e.quantity && e.quantity > 1 ? ` · ${e.quantity} ${e.unit ?? 'uds'}` : ''
    return `<tr><td ${tdL}>${e.name}${qty}</td><td ${tdR}>${e.amount * (e.quantity ?? 1)}€</td></tr>`
  }).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin:20px 0 24px;">
    ${lodgingRows}
    ${discountRows}
    ${cleaningFee > 0 ? `<tr><td ${tdL}>${t.cleaningFee}</td><td ${tdR}>${cleaningFee}€</td></tr>` : ''}
    ${extraRows}
    <tr><td ${tdLBold}>${t.total}</td><td ${tdRBold}>${total}€</td></tr>
  </table>`
}
