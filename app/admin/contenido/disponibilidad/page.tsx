import { getBloqueos, getPrecios } from '../actions'
import { supabaseAdmin } from '@/lib/supabase-admin'
import CalendarioAdminClient from '@/components/CalendarioAdminClient'

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function DisponibilidadPage() {
  const db = supabaseAdmin as any

  const [bloqueos, precios] = await Promise.all([
    getBloqueos().catch(() => []),
    getPrecios().catch(() => []),
  ])

  const today = new Date().toISOString().split('T')[0]
  const sixMonths = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
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
