import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const today = localDateStr(new Date())
  const oneYear = localDateStr(new Date(Date.now() + 365 * 86400000))

  const [{ data: reservas }, { data: bloqueos }] = await Promise.all([
    db.from('reservas')
      .select('check_in, check_out')
      .eq('apartment_slug', slug)
      .eq('status', 'confirmed')
      .gte('check_out', today)
      .lte('check_in', oneYear),
    db.from('bloqueos')
      .select('fecha_inicio, fecha_fin')
      .eq('apartment_slug', slug)
      .gte('fecha_fin', today)
      .lte('fecha_inicio', oneYear),
  ])

  const ranges: Array<{ start: string; end: string }> = [
    ...(reservas ?? []).map((r: { check_in: string; check_out: string }) => ({ start: r.check_in, end: r.check_out })),
    ...(bloqueos ?? []).map((b: { fecha_inicio: string; fecha_fin: string }) => ({ start: b.fecha_inicio, end: b.fecha_fin })),
  ]

  return NextResponse.json({ ranges }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
