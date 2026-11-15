/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

// Sección "Guía local" (antes /informacion). Cada idioma tiene su propia ruta:
//   /es/guia-local/<slug>      /en/local-guide/<slug_en>
export const GUIA_SEGMENT = { es: 'guia-local', en: 'local-guide' } as const
export type GuiaLocale = keyof typeof GUIA_SEGMENT

export function asGuiaLocale(locale: string): GuiaLocale {
  return locale === 'en' ? 'en' : 'es'
}

export function guiaPath(locale: string, slug?: string) {
  const l = asGuiaLocale(locale)
  return `/${l}/${GUIA_SEGMENT[l]}${slug ? `/${slug}` : ''}`
}

export interface Articulo {
  id: number
  titulo: string
  titulo_en?: string | null
  slug: string
  slug_en?: string | null
  slugs_antiguos?: string[] | null
  contenido: string
  contenido_en?: string | null
  imagen_url?: string | null
  hero_image?: string | null
  categoria?: string | null
  categoria_en?: string | null
  extracto?: string | null
  extracto_en?: string | null
  created_at: string
}

/** Slug que corresponde al idioma (si no hay versión EN del slug, usa el ES) */
export function articleSlug(a: Pick<Articulo, 'slug' | 'slug_en'>, locale: string) {
  return asGuiaLocale(locale) === 'en' ? (a.slug_en || a.slug) : a.slug
}

const SLUG_RE = /^[a-z0-9-]+$/

/** Busca un artículo publicado por su slug ES, EN o por un slug antiguo */
export async function findArticulo(slug: string): Promise<Articulo | null> {
  const s = decodeURIComponent(slug).toLowerCase()
  if (!SLUG_RE.test(s)) return null
  const { data } = await (supabase as any)
    .from('articulos')
    .select('*')
    .eq('publicado', true)
    .or(`slug.eq.${s},slug_en.eq.${s},slugs_antiguos.cs.{${s}}`)
    .limit(1)
  return (data?.[0] as Articulo) ?? null
}

export async function getPublishedArticulos(): Promise<Articulo[]> {
  const { data } = await (supabase as any)
    .from('articulos')
    .select('id, titulo, titulo_en, slug, slug_en, contenido, imagen_url, hero_image, categoria, categoria_en, extracto, extracto_en, created_at')
    .eq('publicado', true)
    .order('created_at', { ascending: false })
  return (data ?? []) as Articulo[]
}

export { slugify, shortSlug } from '@/lib/slug'
