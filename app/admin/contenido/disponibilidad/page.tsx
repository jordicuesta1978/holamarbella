import { getBloqueos, getPrecios } from '../actions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CalendarioAdminClient from '@/components/CalendarioAdminClient'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function DisponibilidadPage() {
  const db = supabaseAdmin as any

  const [bloqueos, precios] = await Promise.all([
    getBloqueos().catch(() => []),
    getPrecios().catch(() => []),
  ])

  const today = localDateStr(new Date())
  const sixMonths = localDateStr(new Date(Date.now() + 180 * 86400000))
  const { data: reservasData } = await db
    .from('reservas')
    .select('apartment_slug, check_in, check_out, guest_name')
    .eq('status', 'confirmed')
    .gte('check_out', today)
    .lte('check_in', sixMonths)

  return (
    <CalendarioAdminClient
      bloqueos={bloqueos}
      reservas={reservasData ?? []}
      precios={precios}
    />
  )
}
