import { supabase } from './supabase'
import type { Apartment, ApartmentReview, AmenityCategory } from './apartments'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Apartment {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    badge: row.badge ?? undefined,
    capacity: {
      persons: row.persons,
      bedrooms: row.bedrooms,
      bed: row.bed,
      bathrooms: row.bathrooms,
      extras: row.bed_extras ?? undefined,
    },
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
    .order('id')
  if (error) throw new Error(error.message)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(mapRow)
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
