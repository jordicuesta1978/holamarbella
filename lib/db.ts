import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type { Apartment, ApartmentReview, AmenityCategory } from './apartments'
import { computeKeyFeatures } from './apartments'
import { getApartmentTranslation, getApartmentTranslations, type ApartmentTranslation } from './translations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SUPABASE_STORAGE_BASE = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    return url ? `${url}/storage/v1/object/public/apartamentos/` : ''
  } catch { return '' }
})()

async function readOrderJson(slug: string): Promise<string[] | null> {
  try {
    const { data, error } = await supabaseAdmin.storage.from('apartamentos').download(`${slug}/_order.json`)
    if (error || !data) return null
    const text = await data.text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : (parsed.order ?? null)
  } catch { return null }
}

// Local-date helpers — avoid toISOString() to prevent UTC+N shift
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function daysFromNow(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

type Locale = string

// Builds the base (ES) apartment from a DB row. Localized content is layered
// on top via applyTranslation() so this stays a pure, synchronous mapping.
function mapRow(row: any, primaryPhotoUrl?: string): Apartment {
  const capacity = {
    persons: row.persons,
    bedrooms: row.bedrooms,
    bed: row.bed,
    bathrooms: row.bathrooms,
    extras: row.bed_extras ?? undefined,
  }

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    key_features: computeKeyFeatures(capacity),
    rating: Number(row.rating),
    reviewCount: row.review_count,
    badge: row.badge ?? undefined,
    capacity,
    description: row.description,
    license: row.license,
    photoCount: row.photo_count,
    primaryPhotoUrl,
    priceRange: [row.price_min, row.price_max],
    topAmenities: row.top_amenities as string[],
    amenityCategories: row.amenity_categories as AmenityCategory[],
    reviews: [],
  }
}

// Overlays a translation onto a base apartment. Empty fields fall back to ES.
function applyTranslation(apt: Apartment, tr: ApartmentTranslation | null): Apartment {
  if (!tr) return apt
  const key_features = Array.isArray(tr.key_features) && tr.key_features.length > 0
    ? tr.key_features.join(' · ')
    : apt.key_features
  const topAmenities = Array.isArray(tr.top_amenities) && tr.top_amenities.length > 0
    ? tr.top_amenities
    : apt.topAmenities
  const amenityCategories = Array.isArray(tr.amenity_categories) && tr.amenity_categories.length > 0
    ? tr.amenity_categories
    : apt.amenityCategories
  return {
    ...apt,
    title: tr.name || apt.title,
    subtitle: tr.subtitle || apt.subtitle,
    description: tr.description || apt.description,
    key_features,
    topAmenities,
    amenityCategories,
  }
}

export async function getApartments(locale: Locale = 'es'): Promise<Apartment[]> {
  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .neq('active', false)
    .order('id')
  if (error) throw new Error(error.message)
  const rows = data as any[]
  // Primary photos (_order.json) and translations fetched in parallel
  const [orders, translations] = await Promise.all([
    Promise.all(rows.map(r => readOrderJson(r.slug).catch(() => null))),
    getApartmentTranslations(rows.map(r => r.slug), locale),
  ])
  return rows.map((row, i) => {
    const order = orders[i]
    const primaryPath = order?.[0]
    const primaryPhotoUrl = primaryPath ? SUPABASE_STORAGE_BASE + primaryPath : undefined
    return applyTranslation(mapRow(row, primaryPhotoUrl), translations[row.slug] ?? null)
  })
}

export async function getStoragePhotos(slug: string): Promise<string[]> {
  try {
    const [files, storedOrder] = await Promise.all([
      supabaseAdmin.storage.from('apartamentos').list(slug, { sortBy: { column: 'created_at', order: 'asc' } }),
      readOrderJson(slug),
    ])
    const validFiles = (files.data ?? []).filter(f => f.name !== '_order.json' && !f.name.startsWith('.'))
    if (validFiles.length === 0) return []

    const allPaths = validFiles.map(f => `${slug}/${f.name}`)
    const base = SUPABASE_STORAGE_BASE

    if (storedOrder && storedOrder.length > 0) {
      const ordered = [...storedOrder.filter(p => allPaths.includes(p))]
      for (const p of allPaths) if (!ordered.includes(p)) ordered.push(p)
      return ordered.map(p => base + p)
    }

    return allPaths.map(p => base + p)
  } catch {
    return []
  }
}

export async function getPriceRanges(slug: string): Promise<Array<{ start: string; end: string; price: number }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any
  const today = localDateStr(new Date())
  const { data } = await db.from('precios').select('fecha_inicio, fecha_fin, precio_noche').eq('apartment_slug', slug).gte('fecha_fin', today).order('fecha_inicio')
  return (data ?? []).map((r: { fecha_inicio: string; fecha_fin: string; precio_noche: number }) => ({
    start: r.fecha_inicio, end: r.fecha_fin, price: r.precio_noche,
  }))
}

export async function getMinNightsRanges(slug: string): Promise<Array<{ start: string | null; end: string | null; min_nights: number }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any
  try {
    const { data, error } = await db.from('minimum_nights').select('start_date, end_date, min_nights').eq('apartment_slug', slug)
    if (error) return []
    return (data ?? []).map((r: { start_date: string | null; end_date: string | null; min_nights: number }) => ({
      start: r.start_date, end: r.end_date, min_nights: r.min_nights,
    }))
  } catch { return [] }
}

export async function getBlockedRanges(slug: string): Promise<Array<{ start: string; end: string }>> {
  const today = localDateStr(new Date())
  const oneYear = daysFromNow(365)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any
  const [{ data: reservas }, { data: bloqueos }] = await Promise.all([
    db.from('reservas').select('check_in, check_out').eq('apartment_slug', slug).eq('status', 'confirmed').gte('check_out', today).lte('check_in', oneYear),
    db.from('bloqueos').select('fecha_inicio, fecha_fin').eq('apartment_slug', slug).gte('fecha_fin', today).lte('fecha_inicio', oneYear),
  ])
  return [
    ...(reservas ?? []).map((r: { check_in: string; check_out: string }) => ({ start: r.check_in, end: r.check_out })),
    ...(bloqueos ?? []).map((b: { fecha_inicio: string; fecha_fin: string }) => ({ start: b.fecha_inicio, end: b.fecha_fin })),
  ]
}

export async function getGlobalBlockedDates(): Promise<string[]> {
  const SLUGS = ['paloma', 'micu', 'larysol', 'ami', 'banesto']
  const today = localDateStr(new Date())
  const sixMonths = daysFromNow(180)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any
  const [{ data: reservas }, { data: bloqueos }] = await Promise.all([
    db.from('reservas').select('apartment_slug, check_in, check_out').eq('status', 'confirmed').gte('check_out', today).lte('check_in', sixMonths),
    db.from('bloqueos').select('apartment_slug, fecha_inicio, fecha_fin').gte('fecha_fin', today).lte('fecha_inicio', sixMonths),
  ])

  // Count occupied apartments per day
  const occupied: Record<string, Set<string>> = {}
  const addRange = (slug: string, start: string, end: string) => {
    const s = new Date(start + 'T00:00:00')
    const e = new Date(end + 'T00:00:00')
    for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
      const key = localDateStr(d)
      if (!occupied[key]) occupied[key] = new Set()
      occupied[key].add(slug)
    }
  }
  for (const r of (reservas ?? [])) addRange(r.apartment_slug, r.check_in, r.check_out)
  for (const b of (bloqueos ?? [])) addRange(b.apartment_slug, b.fecha_inicio, b.fecha_fin)

  // A date is "globally blocked" only if all active apartments are occupied
  return Object.entries(occupied)
    .filter(([, slugs]) => slugs.size >= SLUGS.length)
    .map(([date]) => date)
}

export async function getApartmentBySlug(slug: string, locale: Locale = 'es'): Promise<Apartment | null> {
  const [{ data: apt, error }, { data: resenas }, order, translation] = await Promise.all([
    supabase.from('apartments').select('*').eq('slug', slug).single(),
    supabase.from('resenas').select('*').eq('apartment_slug', slug).order('id'),
    readOrderJson(slug).catch(() => null),
    getApartmentTranslation(slug, locale),
  ])
  if (error || !apt) return null

  const primaryPath = order?.[0]
  const primaryPhotoUrl = primaryPath ? SUPABASE_STORAGE_BASE + primaryPath : undefined
  const apartment = applyTranslation(mapRow(apt, primaryPhotoUrl), translation)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apartment.reviews = ((resenas ?? []) as any[]).map((r): ApartmentReview => ({
    author: r.author,
    location: r.location,
    date: r.date,
    rating: Number(r.rating),
    text: r.text,
    source: r.source ?? null,
    source_url: r.source_url ?? null,
  }))
  return apartment
}
