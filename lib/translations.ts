import { supabase } from './supabase'
import { routing } from '@/i18n/routing'
import type { AmenityCategory } from './apartments'

export type ApartmentTranslation = {
  name: string | null
  subtitle: string | null
  description: string | null
  key_features: string[] | null
  top_amenities: string[] | null
  amenity_categories: AmenityCategory[] | null
}

// Single source of truth for supported locales = i18n routing config.
// Adding a locale in i18n/routing.ts makes it available everywhere: public
// routing, the translation lookups below and the admin content manager.
export const BASE_LOCALE = routing.defaultLocale            // 'es' — lives in `apartments`
export const SUPPORTED_LOCALES = routing.locales            // ['es', 'en', …]
export const TRANSLATABLE_LOCALES = routing.locales.filter(l => l !== BASE_LOCALE)

// apartment_translations isn't in the generated Database types yet → cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// Single apartment. Returns null for the base locale or when no translation
// exists, so callers fall back to the ES content stored in `apartments`.
export async function getApartmentTranslation(slug: string, locale: string): Promise<ApartmentTranslation | null> {
  if (locale === BASE_LOCALE) return null
  const { data, error } = await db
    .from('apartment_translations')
    .select('name, subtitle, description, key_features, top_amenities, amenity_categories')
    .eq('apartment_slug', slug)
    .eq('locale', locale)
    .maybeSingle()
  if (error || !data) return null
  return data as ApartmentTranslation
}

// Batch variant for listings — one query for many slugs, keyed by slug.
export async function getApartmentTranslations(slugs: string[], locale: string): Promise<Record<string, ApartmentTranslation>> {
  if (locale === BASE_LOCALE || slugs.length === 0) return {}
  const { data, error } = await db
    .from('apartment_translations')
    .select('apartment_slug, name, subtitle, description, key_features, top_amenities, amenity_categories')
    .eq('locale', locale)
    .in('apartment_slug', slugs)
  if (error || !data) return {}
  const map: Record<string, ApartmentTranslation> = {}
  for (const row of data as Array<ApartmentTranslation & { apartment_slug: string }>) {
    map[row.apartment_slug] = row
  }
  return map
}
