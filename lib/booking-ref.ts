import { supabaseAdmin } from './supabase-admin'

const APT_CODES: Record<string, string> = {
  paloma: 'PAL',
  larysol: 'LAR',
  micu: 'MIC',
  ami: 'AMI',
  banesto: 'BAN',
}

export function getBookingRef(id: number, slug: string, createdAt: string): string {
  const d = new Date(createdAt)
  const date = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }).replace(/-/g, '')
  const code = APT_CODES[slug] ?? slug.slice(0, 3).toUpperCase()
  const counter = String(id % 99 + 1).padStart(2, '0')
  return `${date}${code}${counter}`
}

export async function generateDailyBookingRef(id: number, slug: string, createdAt: string): Promise<string> {
  const d = new Date(createdAt)
  const date = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }).replace(/-/g, '')
  const code = APT_CODES[slug] ?? slug.slice(0, 3).toUpperCase()
  const prefix = `${date}${code}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any
  const { count } = await db
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .like('booking_ref', `${prefix}%`)
    .neq('id', id)

  const counter = String((count ?? 0) + 1).padStart(2, '0')
  return `${prefix}${counter}`
}
