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

// ── Articulos ─────────────────────────────────────────────────────────────────

export async function getArticulos() {
  const { data } = await db.from('articulos').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function saveArticulo(id: number | null, titulo: string, slug: string, contenido: string, publicado: boolean, imagen_url?: string) {
  const payload: Record<string, unknown> = { titulo, slug, contenido, publicado }
  if (imagen_url !== undefined) payload.imagen_url = imagen_url || null
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

export async function getApartamentoPhotos(slug: string): Promise<{ path: string; url: string; isPrimary: boolean }[]> {
  // Ensure bucket exists
  const { error: bucketErr } = await supabaseAdmin.storage.getBucket('apartamentos')
  if (bucketErr) {
    await supabaseAdmin.storage.createBucket('apartamentos', { public: true }).catch(() => {})
  }

  const { data: files, error } = await supabaseAdmin.storage.from('apartamentos').list(slug, { sortBy: { column: 'created_at', order: 'asc' } })
  if (error || !files || files.length === 0) return []
  const { data: apt } = await db.from('apartments').select('primary_photo').eq('slug', slug).single()
  const primaryPath = apt?.primary_photo ?? ''
  const filtered = files.filter(f => f.name !== '.emptyFolderPlaceholder' && !f.name.startsWith('.'))
  return filtered.map((f, idx) => {
    const path = `${slug}/${f.name}`
    const { data: urlData } = supabaseAdmin.storage.from('apartamentos').getPublicUrl(path)
    return { path, url: urlData.publicUrl, isPrimary: path === primaryPath || (!primaryPath && idx === 0) }
  })
}

export async function setApartamentoPrimaryPhoto(slug: string, photoPath: string) {
  await db.from('apartments').update({ primary_photo: photoPath }).eq('slug', slug)
  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
  revalidatePath('/apartamentos')
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
  apartment_slug: string; author: string; location: string; date: string; rating: number; text: string
}) {
  if (id) {
    await db.from('resenas').update(fields).eq('id', id)
  } else {
    const { data: last } = await db.from('resenas').select('sort_order').order('sort_order', { ascending: false }).limit(1)
    const nextOrder = ((last?.[0]?.sort_order ?? 0) as number) + 1
    await db.from('resenas').insert({ ...fields, sort_order: nextOrder })
  }
  revalidatePath('/admin/contenido/resenas')
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
