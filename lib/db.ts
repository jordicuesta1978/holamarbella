import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'
import type { Apartment, ApartmentReview, AmenityCategory } from './apartments'
import { computeKeyFeatures } from './apartments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Apartment {
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
    priceRange: [row.price_min, row.price_max],
    topAmenities: row.top_amenities as string[],
    amenityCategories: row.amenity_categories as AmenityCategory[],
    reviews: [],
  }
}

export async function getApartments(): Promise<Apartment[]> {
  const { data, error } = await supabase
    .from('apartments')
    .select('*')
    .neq('active', false)
    .order('id')
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(mapRow)
}

export async function getBlockedRanges(slug: string): Promise<Array<{ start: string; end: string }>> {
  const today = new Date().toISOString().split('T')[0]
  const oneYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
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
  const today = new Date().toISOString().split('T')[0]
  const sixMonths = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
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
      const key = d.toISOString().split('T')[0]
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

export async function getApartmentBySlug(slug: string): Promise<Apartment | null> {
  const { data: apt, error } = await supabase
    .from('apartments')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !apt) return null

  const { data: resenas } = await supabase
    .from('resenas')
    .select('*')
    .eq('apartment_slug', slug)
    .order('id')

  const apartment = mapRow(apt)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apartment.reviews = ((resenas ?? []) as any[]).map((r): ApartmentReview => ({
    author: r.author,
    location: r.location,
    date: r.date,
    rating: Number(r.rating),
    text: r.text,
  }))
  return apartment
}
