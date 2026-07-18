'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

const db = supabaseAdmin as any

// ── Noches mínimas ───────────────────────────────────────────────────────────

export async function getMinNights(slug?: string): Promise<Array<{ id: number; apartment_slug: string; start_date: string | null; end_date: string | null; min_nights: number }>> {
  try {
    let q = db.from('minimum_nights').select('*').order('apartment_slug').order('start_date', { ascending: true, nullsFirst: true })
    if (slug) q = q.eq('apartment_slug', slug)
    const { data, error } = await q
    if (error) return []
    return data ?? []
  } catch { return [] }
}

export async function addMinNights(slug: string, startDate: string | null, endDate: string | null, minNights: number) {
  const { error } = await db.from('minimum_nights').insert({ apartment_slug: slug, start_date: startDate || null, end_date: endDate || null, min_nights: minNights })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/contenido/precios')
}

export async function deleteMinNights(id: number) {
  await db.from('minimum_nights').delete().eq('id', id)
  revalidatePath('/admin/contenido/precios')
}

// ── Configuracion ─────────────────────────────────────────────────────────────

export async function saveCleaningFee(slug: string, fee: number) {
  await db.from('configuracion').upsert({ apartment_slug: slug, cleaning_fee: fee, updated_at: new Date().toISOString() }, { onConflict: 'apartment_slug' })
  revalidatePath('/admin/contenido/configuracion')
}

export async function getCleaningFees(): Promise<Record<string, number>> {
  const { data } = await db.from('configuracion').select('apartment_slug, cleaning_fee')
  const map: Record<string, number> = {}
  for (const row of data ?? []) map[row.apartment_slug] = row.cleaning_fee
  return map
}

export async function getCleaningFee(slug: string): Promise<number> {
  const fees = await getCleaningFees()
  return fees[slug] ?? 40
}

// ── Bloqueos ──────────────────────────────────────────────────────────────────

export async function addBloqueo(slug: string, desde: string, hasta: string, motivo: string) {
  const { error } = await db.from('bloqueos').insert({ apartment_slug: slug, fecha_inicio: desde, fecha_fin: hasta, motivo })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/contenido/disponibilidad')
}

export async function deleteBloqueo(id: number) {
  await db.from('bloqueos').delete().eq('id', id)
  revalidatePath('/admin/contenido/disponibilidad')
}

export async function getBloqueos() {
  const { data } = await db.from('bloqueos').select('*').order('fecha_inicio')
  return data ?? []
}

// ── Precios ───────────────────────────────────────────────────────────────────

export async function addPrecio(slug: string, desde: string, hasta: string, precio: number) {
  const { error } = await db.from('precios').insert({ apartment_slug: slug, fecha_inicio: desde, fecha_fin: hasta, precio_noche: precio })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/contenido/precios')
}

export async function deletePrecio(id: number) {
  await db.from('precios').delete().eq('id', id)
  revalidatePath('/admin/contenido/precios')
}

export async function getPrecios() {
  const { data } = await db.from('precios').select('*').order('apartment_slug').order('fecha_inicio')
  return data ?? []
}

// ── Apartamentos ──────────────────────────────────────────────────────────────

export async function getApartamentos(): Promise<Record<string, any>[]> {
  const { data } = await db.from('apartments').select('*').order('id')
  return data ?? []
}

export async function saveApartamento(slug: string, fields: { title?: string; subtitle?: string; description?: string }) {
  await db.from('apartments').update(fields).eq('slug', slug)
  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
}

export async function saveApartamentoFull(slug: string, fields: {
  title?: string
  subtitle?: string
  description?: string
  persons?: number
  bedrooms?: number
  bed?: string
  bathrooms?: number
  bed_extras?: string
  license?: string
  price_min?: number
  price_max?: number
  top_amenities?: string[]
  active?: boolean
  cleaning_fee?: number
}) {
  const { active, cleaning_fee, ...rest } = fields

  // Core fields (always exist)
  await db.from('apartments').update(rest).eq('slug', slug)

  // New fields (post-migration v2) — graceful degradation if columns don't exist yet
  const newFields: Record<string, unknown> = {}
  if (active !== undefined) newFields.active = active
  if (cleaning_fee !== undefined) newFields.cleaning_fee = cleaning_fee
  if (Object.keys(newFields).length > 0) {
    await db.from('apartments').update(newFields).eq('slug', slug)
  }

  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath('/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
}

// ── Traducciones de apartamentos ───────────────────────────────────────────────

// Todas las traducciones, agrupadas por slug → locale, para el gestor.
type AdminTranslation = {
  name: string
  subtitle: string
  description: string
  key_features: string[]
  top_amenities: string[]
}

export async function getApartmentTranslationsForAdmin(): Promise<
  Record<string, Record<string, AdminTranslation>>
> {
  const { data } = await db
    .from('apartment_translations')
    .select('apartment_slug, locale, name, subtitle, description, key_features, top_amenities')
  const map: Record<string, Record<string, AdminTranslation>> = {}
  for (const r of data ?? []) {
    if (!map[r.apartment_slug]) map[r.apartment_slug] = {}
    map[r.apartment_slug][r.locale] = {
      name: r.name ?? '',
      subtitle: r.subtitle ?? '',
      description: r.description ?? '',
      key_features: r.key_features ?? [],
      top_amenities: r.top_amenities ?? [],
    }
  }
  return map
}

export async function saveApartmentTranslation(
  slug: string,
  locale: string,
  fields: { name: string; subtitle: string; description: string; key_features: string[]; top_amenities: string[] }
) {
  const { error } = await db.from('apartment_translations').upsert(
    {
      apartment_slug: slug,
      locale,
      name: fields.name.trim() || null,
      subtitle: fields.subtitle.trim() || null,
      description: fields.description.trim() || null,
      key_features: fields.key_features.length > 0 ? fields.key_features : null,
      top_amenities: fields.top_amenities.length > 0 ? fields.top_amenities : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'apartment_slug,locale' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath('/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
  revalidatePath('/')
}

// ── Articulos ─────────────────────────────────────────────────────────────────

export interface ArticuloRow {
  id: number
  titulo: string
  titulo_en?: string | null
  slug: string
  contenido: string
  contenido_en?: string | null
  publicado: boolean
  imagen_url?: string | null
  hero_image?: string | null
  categoria?: string | null
  categoria_en?: string | null
  extracto?: string | null
  extracto_en?: string | null
  created_at: string
  updated_at?: string | null
}

export async function getArticulos(): Promise<ArticuloRow[]> {
  const { data } = await db.from('articulos').select('*').order('created_at', { ascending: false })
  return (data ?? []) as ArticuloRow[]
}

export async function saveArticulo(
  id: number | null,
  data: {
    titulo: string
    slug: string
    contenido: string
    publicado: boolean
    imagen_url?: string
    titulo_en?: string
    contenido_en?: string
    categoria?: string
    categoria_en?: string
    extracto?: string
    extracto_en?: string
    hero_image?: string
  }
) {
  const payload: Record<string, unknown> = {
    titulo: data.titulo,
    slug: data.slug,
    contenido: data.contenido,
    publicado: data.publicado,
    imagen_url: data.imagen_url || null,
    titulo_en: data.titulo_en || null,
    contenido_en: data.contenido_en || null,
    categoria: data.categoria || null,
    categoria_en: data.categoria_en || null,
    extracto: data.extracto || null,
    extracto_en: data.extracto_en || null,
    hero_image: data.hero_image || null,
  }
  if (id) {
    payload.updated_at = new Date().toISOString()
    await db.from('articulos').update(payload).eq('id', id)
  } else {
    await db.from('articulos').insert(payload)
  }
  revalidatePath('/admin/contenido/blog')
  revalidatePath('/informacion')
}

export async function deleteArticulo(id: number) {
  await db.from('articulos').delete().eq('id', id)
  revalidatePath('/admin/contenido/blog')
}

// ── Fotos (Storage) ───────────────────────────────────────────────────────────

const ORDER_FILE = '_order.json'

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.getBucket('apartamentos')
  if (error) await supabaseAdmin.storage.createBucket('apartamentos', { public: true }).catch(() => {})
}

async function readPhotoOrder(slug: string): Promise<string[] | null> {
  const { data, error } = await supabaseAdmin.storage.from('apartamentos').download(`${slug}/${ORDER_FILE}`)
  if (error || !data) return null
  try {
    const text = await data.text()
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : (parsed.order ?? null)
  } catch { return null }
}

async function writePhotoOrder(slug: string, orderedPaths: string[]) {
  const bytes = Buffer.from(JSON.stringify(orderedPaths))
  await supabaseAdmin.storage.from('apartamentos').upload(`${slug}/${ORDER_FILE}`, bytes, {
    contentType: 'text/plain', upsert: true,
  })
}

export async function getApartamentoPhotos(slug: string): Promise<{ path: string; url: string; isPrimary: boolean }[]> {
  await ensureBucket()

  const { data: files, error } = await supabaseAdmin.storage
    .from('apartamentos')
    .list(slug, { sortBy: { column: 'created_at', order: 'asc' } })
  if (error || !files) return []

  const photoFiles = files.filter(f =>
    f.name !== ORDER_FILE && f.name !== '.emptyFolderPlaceholder' && !f.name.startsWith('.')
  )
  if (photoFiles.length === 0) return []

  const allPaths = photoFiles.map(f => `${slug}/${f.name}`)
  const storedOrder = await readPhotoOrder(slug)

  // Build ordered list: stored order first, then any new files not yet in order
  let ordered: string[]
  if (storedOrder && storedOrder.length > 0) {
    ordered = [...storedOrder.filter(p => allPaths.includes(p))]
    for (const p of allPaths) if (!ordered.includes(p)) ordered.push(p)
  } else {
    ordered = allPaths
  }

  const primaryPath = ordered[0] ?? ''
  return ordered.map(path => {
    const { data: urlData } = supabaseAdmin.storage.from('apartamentos').getPublicUrl(path)
    return { path, url: urlData.publicUrl, isPrimary: path === primaryPath }
  })
}

export async function setApartamentoPrimaryPhoto(slug: string, photoPath: string) {
  // Read current order, move photoPath to front
  const current = await readPhotoOrder(slug)
  const { data: files } = await supabaseAdmin.storage.from('apartamentos').list(slug, { sortBy: { column: 'created_at', order: 'asc' } })
  const allPaths = (files ?? []).filter(f => f.name !== ORDER_FILE && !f.name.startsWith('.')).map(f => `${slug}/${f.name}`)
  const base = (current ?? allPaths).filter(p => p !== photoPath)
  await writePhotoOrder(slug, [photoPath, ...base])
  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
  revalidatePath('/apartamentos')
  revalidatePath('/')
}

export async function savePhotoOrder(slug: string, orderedPaths: string[]) {
  await writePhotoOrder(slug, orderedPaths)
  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
  revalidatePath('/apartamentos')
  revalidatePath('/')
}

// ── Reseñas ───────────────────────────────────────────────────────────────────

export async function getResenas() {
  const { data } = await db
    .from('resenas')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
  return data ?? []
}

export async function saveResena(id: number | null, fields: {
  author: string; rating: number
  apartment_slug?: string | null; location?: string | null; date?: string | null; text?: string | null
  source?: string | null; source_url?: string | null; featured?: boolean
}) {
  if (id) {
    await db.from('resenas').update(fields).eq('id', id)
  } else {
    const { data: last } = await db.from('resenas').select('sort_order').order('sort_order', { ascending: false }).limit(1)
    const nextOrder = ((last?.[0]?.sort_order ?? 0) as number) + 1
    await db.from('resenas').insert({ ...fields, sort_order: nextOrder })
  }
  revalidatePath('/admin/contenido/resenas')
  revalidatePath('/')
}

export async function getFeaturedResenas() {
  const { data } = await db
    .from('resenas')
    .select('*')
    .eq('featured', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
  return data ?? []
}

export async function deleteResena(id: number) {
  await db.from('resenas').delete().eq('id', id)
  revalidatePath('/admin/contenido/resenas')
}

export async function moveResena(id: number, direction: 'up' | 'down') {
  const { data: current } = await db.from('resenas').select('id, sort_order').eq('id', id).single()
  if (!current) return

  const currentOrder = current.sort_order ?? current.id

  let adjacentQuery = db.from('resenas').select('id, sort_order')
  if (direction === 'up') {
    adjacentQuery = adjacentQuery.lt('sort_order', currentOrder).order('sort_order', { ascending: false }).limit(1)
  } else {
    adjacentQuery = adjacentQuery.gt('sort_order', currentOrder).order('sort_order', { ascending: true }).limit(1)
  }
  const { data: adjacents } = await adjacentQuery
  const adjacent = adjacents?.[0]
  if (!adjacent) return

  const adjOrder = adjacent.sort_order ?? adjacent.id
  await db.from('resenas').update({ sort_order: adjOrder }).eq('id', id)
  await db.from('resenas').update({ sort_order: currentOrder }).eq('id', adjacent.id)

  revalidatePath('/admin/contenido/resenas')
}
