'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

const db = supabaseAdmin as any

// ── Configuracion ─────────────────────────────────────────────────────────────

export async function saveCleaningFee(slug: string, fee: number) {
  await db.from('configuracion').upsert({ apartment_slug: slug, cleaning_fee: fee, updated_at: new Date().toISOString() }, { onConflict: 'apartment_slug' })
  revalidatePath('/admin/contenido/configuracion')
}

export async function getCleaningFees(): Promise<Record<string, number>> {
  const { data } = await db.from('configuracion').select('apartment_slug, cleaning_fee').catch(() => ({ data: [] }))
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
  await db.from('bloqueos').insert({ apartment_slug: slug, fecha_inicio: desde, fecha_fin: hasta, motivo })
  revalidatePath('/admin/contenido/disponibilidad')
}

export async function deleteBloqueo(id: number) {
  await db.from('bloqueos').delete().eq('id', id)
  revalidatePath('/admin/contenido/disponibilidad')
}

export async function getBloqueos() {
  const { data } = await db.from('bloqueos').select('*').order('fecha_inicio').catch(() => ({ data: [] }))
  return data ?? []
}

// ── Precios ───────────────────────────────────────────────────────────────────

export async function addPrecio(slug: string, desde: string, hasta: string, precio: number) {
  await db.from('precios').insert({ apartment_slug: slug, fecha_inicio: desde, fecha_fin: hasta, precio_noche: precio })
  revalidatePath('/admin/contenido/precios')
}

export async function deletePrecio(id: number) {
  await db.from('precios').delete().eq('id', id)
  revalidatePath('/admin/contenido/precios')
}

export async function getPrecios() {
  const { data } = await db.from('precios').select('*').order('apartment_slug').order('fecha_inicio').catch(() => ({ data: [] }))
  return data ?? []
}

// ── Apartamentos content ──────────────────────────────────────────────────────

export async function saveApartamento(slug: string, fields: { title?: string; subtitle?: string; description?: string }) {
  await db.from('apartments').update(fields).eq('slug', slug)
  revalidatePath('/admin/contenido/apartamentos')
  revalidatePath(`/apartamentos/${slug}`)
}

// ── Articulos ─────────────────────────────────────────────────────────────────

export async function getArticulos() {
  const { data } = await db.from('articulos').select('*').order('created_at', { ascending: false }).catch(() => ({ data: [] }))
  return data ?? []
}

export async function saveArticulo(id: number | null, titulo: string, slug: string, contenido: string, publicado: boolean) {
  if (id) {
    await db.from('articulos').update({ titulo, slug, contenido, publicado, updated_at: new Date().toISOString() }).eq('id', id)
  } else {
    await db.from('articulos').insert({ titulo, slug, contenido, publicado })
  }
  revalidatePath('/admin/contenido/blog')
  revalidatePath('/informacion')
}

export async function deleteArticulo(id: number) {
  await db.from('articulos').delete().eq('id', id)
  revalidatePath('/admin/contenido/blog')
}

// ── Reseñas ───────────────────────────────────────────────────────────────────

export async function getResenas() {
  const { data } = await db.from('resenas').select('*').order('id', { ascending: false }).catch(() => ({ data: [] }))
  return data ?? []
}

export async function saveResena(id: number | null, fields: {
  apartment_slug: string; author: string; location: string; date: string; rating: number; text: string
}) {
  if (id) {
    await db.from('resenas').update(fields).eq('id', id)
  } else {
    await db.from('resenas').insert(fields)
  }
  revalidatePath('/admin/contenido/resenas')
}

export async function deleteResena(id: number) {
  await db.from('resenas').delete().eq('id', id)
  revalidatePath('/admin/contenido/resenas')
}
