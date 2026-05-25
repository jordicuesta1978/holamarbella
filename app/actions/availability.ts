'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'

const ALL_SLUGS = ['paloma', 'micu', 'larysol', 'ami', 'banesto']

async function checkExact(checkIn: string, checkOut: string): Promise<Record<string, boolean>> {
  const db = supabaseAdmin as any
  const { data: occupied } = await db
    .from('reservas')
    .select('apartment_slug')
    .in('status', ['confirmed'])
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  // Also check manual blocks if table exists
  const { data: blocked } = await db
    .from('bloqueos')
    .select('apartment_slug')
    .lt('fecha_inicio', checkOut)
    .gt('fecha_fin', checkIn)

  const occupiedSlugs = new Set([
    ...(occupied ?? []).map((r: any) => r.apartment_slug as string),
    ...(blocked ?? []).map((r: any) => r.apartment_slug as string),
  ])
  return Object.fromEntries(ALL_SLUGS.map(s => [s, !occupiedSlugs.has(s)]))
}

export async function getAvailability(checkIn: string, checkOut: string, flex = 0): Promise<Record<string, boolean>> {
  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return Object.fromEntries(ALL_SLUGS.map(s => [s, true]))
  }

  if (flex === 0) return checkExact(checkIn, checkOut)

  // Flexible: apartment is available if ANY date offset within ±flex days works
  const duration = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
  const results: Record<string, boolean> = Object.fromEntries(ALL_SLUGS.map(s => [s, false]))

  for (let offset = -flex; offset <= flex; offset++) {
    const d = new Date(checkIn + 'T00:00:00')
    d.setDate(d.getDate() + offset)
    const altIn = d.toISOString().split('T')[0]
    const d2 = new Date(d)
    d2.setDate(d2.getDate() + duration)
    const altOut = d2.toISOString().split('T')[0]
    const avail = await checkExact(altIn, altOut)
    for (const slug of ALL_SLUGS) {
      if (avail[slug]) results[slug] = true
    }
  }

  return results
}
