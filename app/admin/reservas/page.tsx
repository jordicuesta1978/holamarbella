import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from '@/app/admin/AdminNavServer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getReservas(status?: string): Promise<any[]> {
  let q = supabaseAdmin
    .from('reservas')
    .select('id, guest_name, guest_email, guest_phone, apartment_slug, check_in, check_out, guests, status, notes, created_at')
    .order('created_at', { ascending: false })

  if (status && ['pending', 'confirmed', 'cancelled'].includes(status)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    q = (q as any).eq('status', status)
  }

  const { data } = await q
  return (data ?? []) as any[]
}

const STATUS_LABEL: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const STATUS_COLOR: Record<string, string> = { pending: '#d97706', confirmed: '#4B766B', cancelled: '#9ca3af' }
const STATUS_BG: Record<string, string> = { pending: '#fef3c7', confirmed: '#d1fae5', cancelled: '#f3f4f6' }

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
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
    { label: 'Confirmadas', value: 'confirmed' },
    { label: 'Canceladas', value: 'cancelled' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Reservas</h1>

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
                  {['Huésped', 'Email', 'Apartamento', 'Llegada', 'Salida', 'Personas', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservas.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < reservas.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                    <td style={{ padding: '11px 14px', color: '#1a1a2e', fontWeight: 500, whiteSpace: 'nowrap' }}>{r.guest_name}</td>
                    <td style={{ padding: '11px 14px', color: '#555' }}>{r.guest_email}</td>
                    <td style={{ padding: '11px 14px', color: '#555' }}>{r.apartment_slug}</td>
                    <td style={{ padding: '11px 14px', color: '#555', whiteSpace: 'nowrap' }}>{fmt(r.check_in)}</td>
                    <td style={{ padding: '11px 14px', color: '#555', whiteSpace: 'nowrap' }}>{fmt(r.check_out)}</td>
                    <td style={{ padding: '11px 14px', color: '#555', textAlign: 'center' }}>{r.guests}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_BG[r.status], color: STATUS_COLOR[r.status], whiteSpace: 'nowrap' }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Link href={`/admin/reservas/${r.id}`} style={{ fontSize: 12, color: '#4B766B', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Ver →</Link>
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>No hay reservas en esta categoría</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
