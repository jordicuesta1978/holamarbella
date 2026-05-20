import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logout } from '@/app/actions/admin'
import { Clock, MessageSquare, CreditCard, CalendarCheck } from 'lucide-react'

async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [pending, mensajes, pagos, llegadas] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin.from('reservas').select('id', { count: 'exact', head: true }).eq('status', 'pending') as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin.from('mensajes_chat').select('id', { count: 'exact', head: true }).eq('sender', 'guest').eq('leido', false) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin.from('reservas').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').is('total_price', null) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabaseAdmin.from('reservas').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').gte('check_in', today).lte('check_in', in7days) as any,
  ])

  return {
    pending: pending.count ?? 0,
    mensajes: mensajes.count ?? 0,
    pagos: pagos.count ?? 0,
    llegadas: llegadas.count ?? 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getRecentReservas(): Promise<any[]> {
  const { data } = await supabaseAdmin
    .from('reservas')
    .select('id, guest_name, guest_email, apartment_slug, check_in, check_out, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  return (data ?? []) as any[]
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706',
  confirmed: '#4B766B',
  cancelled: '#9ca3af',
}
const STATUS_BG: Record<string, string> = {
  pending: '#fef3c7',
  confirmed: '#d1fae5',
  cancelled: '#f3f4f6',
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default async function AdminPage() {
  const [stats, reservas] = await Promise.all([getDashboardStats(), getRecentReservas()])

  const cards = [
    { icon: Clock, label: 'Reservas pendientes', value: stats.pending, href: '/admin/reservas?status=pending', color: '#d97706', bg: '#fef3c7' },
    { icon: MessageSquare, label: 'Mensajes sin leer', value: stats.mensajes, href: '/admin/mensajes', color: '#3b82f6', bg: '#dbeafe' },
    { icon: CreditCard, label: 'Pagos pendientes', value: stats.pagos, href: '/admin/reservas?status=confirmed', color: '#8b5cf6', bg: '#ede9fe' },
    { icon: CalendarCheck, label: 'Llegadas esta semana', value: stats.llegadas, href: '/admin/reservas?status=confirmed', color: '#4B766B', bg: '#d1fae5' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#4B766B' }}>HolaMarbella Admin</span>
          <Link href="/admin" style={{ fontSize: 13, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/admin/reservas" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>Reservas</Link>
        </div>
        <form action={logout}>
          <button type="submit" style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#888', cursor: 'pointer' }}>Salir</button>
        </form>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Dashboard</h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {cards.map(({ icon: Icon, label, value, href, color, bg }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{value}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888', lineHeight: 1.3 }}>{label}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent reservas */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Últimas reservas</h2>
            <Link href="/admin/reservas" style={{ fontSize: 13, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Huésped', 'Apartamento', 'Llegada', 'Salida', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservas.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < reservas.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                    <td style={{ padding: '12px 16px', color: '#1a1a2e', fontWeight: 500 }}>{r.guest_name}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{r.apartment_slug}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{fmt(r.check_in)}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{fmt(r.check_out)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_BG[r.status], color: STATUS_COLOR[r.status] }}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link href={`/admin/reservas/${r.id}`} style={{ fontSize: 12, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>Ver →</Link>
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>No hay reservas todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
