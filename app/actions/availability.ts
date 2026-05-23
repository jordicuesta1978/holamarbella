'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'

const ALL_SLUGS = ['paloma', 'micu', 'larysol', 'ami', 'banesto']

export async function getAvailability(checkIn: string, checkOut: string): Promise<Record<string, boolean>> {
  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return Object.fromEntries(ALL_SLUGS.map(s => [s, true]))
  }

  const db = supabaseAdmin as any
  const { data: occupied } = await db
    .from('reservas')
    .select('apartment_slug')
    .in('status', ['confirmed', 'blocked'])
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  const occupiedSlugs = new Set((occupied ?? []).map((r: any) => r.apartment_slug as string))
  return Object.fromEntries(ALL_SLUGS.map(s => [s, !occupiedSlugs.has(s)]))
}
