import { supabaseAdmin } from './supabase-admin'

// Nombres "de siempre" de los apartamentos originales. Se mantienen para no
// cambiar cómo aparecen hoy en el admin y en los emails. Cualquier apartamento
// nuevo creado desde el gestor sale de la base de datos (título) o, en último
// caso, del slug.
const LABEL_OVERRIDES: Record<string, string> = {
  paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
}
const FULL_OVERRIDES: Record<string, string> = {
  paloma: 'Apartamento Paloma', micu: 'Apartamento Micu', larysol: 'Apartamento Larysol',
  ami: 'Ático AMI', banesto: 'Ático Banesto',
}

function titleCase(slug: string): string {
  return slug.split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}

/** Nombre corto (ej. "Paloma"). Si hay título, usa lo que va antes del primer "·". */
export function aptLabel(slug: string | null | undefined, title?: string | null): string {
  if (!slug) return '—'
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug]
  const fromTitle = title?.split('·')[0]?.trim()
  return fromTitle || titleCase(slug)
}

/** Nombre completo para emails y fichas (ej. "Apartamento Paloma"). */
export function aptFullName(slug: string | null | undefined, title?: string | null): string {
  if (!slug) return '—'
  if (FULL_OVERRIDES[slug]) return FULL_OVERRIDES[slug]
  return `Apartamento ${aptLabel(slug, title)}`
}

export type AptRef = {
  slug: string
  label: string
  fullName: string
  active: boolean
  priceBase: number
}

/** Lista de apartamentos desde la base de datos (orden de creación). */
export async function getApartmentRefs(opts: { activeOnly?: boolean } = {}): Promise<AptRef[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin as any)
    .from('apartments')
    .select('*')
    .order('id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[]
  return rows
    .filter(r => !opts.activeOnly || r.active !== false)
    .map(r => ({
      slug: r.slug,
      label: aptLabel(r.slug, r.title),
      fullName: aptFullName(r.slug, r.title),
      active: r.active !== false,
      priceBase: Math.round(((Number(r.price_min) || 0) + (Number(r.price_max) || 0)) / 2),
    }))
}

export async function getApartmentSlugs(opts: { activeOnly?: boolean } = {}): Promise<string[]> {
  return (await getApartmentRefs(opts)).map(a => a.slug)
}
