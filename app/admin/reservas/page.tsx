import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { getBookingRef } from '@/lib/booking-ref'

/* eslint-disable @typescript-eslint/no-explicit-any */

const APT_NAMES: Record<string, string> = {
  paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
}

async function getReservas(status?: string): Promise<any[]> {
  let q = (supabaseAdmin as any)
    .from('reservas')
    .select('id, guest_name, apartment_slug, check_in, check_out, status, booking_ref, created_at, total_price, paid_at, cleaning_fee')
    .order('created_at', { ascending: false })

  if (status && ['pending', 'quote_sent', 'quote_accepted', 'confirmed', 'cancelled'].includes(status)) {
    q = q.eq('status', status)
  }

  const { data } = await q
  return (data ?? []) as any[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', quote_sent: 'Presupuesto enviado', quote_accepted: 'Presupuesto aceptado',
  confirmed: 'Confirmada', cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706', quote_sent: '#2563eb', quote_accepted: '#7c3aed',
  confirmed: '#4B766B', cancelled: '#9ca3af',
}
const STATUS_BG: Record<string, string> = {
  pending: '#fef3c7', quote_sent: '#dbeafe', quote_accepted: '#ede9fe',
  confirmed: '#d1fae5', cancelled: '#f3f4f6',
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtMoney(n: number | null): string {
  if (n == null) return '—'
  return `${n}€`
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const reservas = await getReservas(status)

  const tabs = [
    { label: 'Todas', value: undefined },
    { label: 'Pendientes', value: 'pending' },
    { label: 'Presupuesto enviado', value: 'quote_sent' },
    { label: 'Presupuesto aceptado', value: 'quote_accepted' },
    { label: 'Confirmadas', value: 'confirmed' },
    { label: 'Canceladas', value: 'cancelled' },
  ]

  // Totals summary
  const totalPendiente = reservas.reduce((sum: number, r: any) => {
    if (r.status === 'confirmed' && r.total_price && !r.paid_at) return sum + r.total_price
    return sum
  }, 0)
  const totalCobrado = reservas.reduce((sum: number, r: any) => {
    if (r.paid_at && r.total_price) return sum + r.total_price
    return sum
  }, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Reservas</h1>

          {/* Summary chips */}
          <div style={{ display: 'flex', gap: 10 }}>
            {totalCobrado > 0 && (
              <div style={{ background: '#d1fae5', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                Cobrado: {totalCobrado}€
              </div>
            )}
            {totalPendiente > 0 && (
              <div style={{ background: '#fef3c7', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>
                Por cobrar: {totalPendiente}€
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(t => {
            const active = t.value === status || (!t.value && !status)
            return (
              <Link
                key={t.label}
                href={t.value ? `/admin/reservas?status=${t.value}` : '/admin/reservas'}
                style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
                  background: active ? '#4B766B' : '#fff', color: active ? '#fff' : '#555',
                  border: '1px solid', borderColor: active ? '#4B766B' : '#e2e8f0',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Huésped', 'Ref', 'Apartamento', 'Llegada', 'Salida', 'Estado', 'Total', 'Cobrado', 'Pendiente', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservas.map((r: any, i: number) => {
                  const total: number | null = r.total_price ?? null
                  const cobrado: number = r.paid_at && total ? total : 0
                  const pendiente: number = total ? total - cobrado : 0

                  return (
                    <tr key={r.id} style={{ borderBottom: i < reservas.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                      <td style={{ padding: '10px 12px', color: '#1a1a2e', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.guest_name}</td>
                      <td style={{ padding: '10px 12px', color: '#888', fontFamily: 'monospace', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {r.booking_ref || getBookingRef(r.id, r.apartment_slug, r.check_in || r.created_at)}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>{APT_NAMES[r.apartment_slug] ?? r.apartment_slug}</td>
                      <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>{fmt(r.check_in)}</td>
                      <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>{fmt(r.check_out)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_BG[r.status], color: STATUS_COLOR[r.status], whiteSpace: 'nowrap' }}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {fmtMoney(total)}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: cobrado > 0 ? '#065f46' : '#aaa', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {cobrado > 0 ? `${cobrado}€` : '0€'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: pendiente > 0 ? '#d97706' : '#aaa', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {total == null ? '—' : pendiente > 0 ? `${pendiente}€` : '✓'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <Link href={`/admin/reservas/${r.id}`} style={{ fontSize: 12, color: '#4B766B', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver →</Link>
                      </td>
                    </tr>
            