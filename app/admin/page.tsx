import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from './AdminNavServer'
import { Clock, MessageSquare, CreditCard, CalendarCheck } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

async function getDashboardData() {
  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [pending, unread, pagos, llegadas, ultimasReservas, proximasLlegadas] = await Promise.all([
    db.from('reservas').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('mensajes_chat').select('id', { count: 'exact', head: true }).eq('sender', 'guest').eq('leido', false),
    db.from('reservas').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').not('total_price', 'is', null),
    db.from('reservas').select('id', { count: 'exact', head: true }).eq('status', 'confirmed').gte('check_in', today).lte('check_in', in7days),
    db.from('reservas').select('id, guest_name, apartment_slug, check_in, check_out, status, created_at').order('created_at', { ascending: false }).limit(5),
    db.from('reservas').select('id, guest_name, apartment_slug, check_in').eq('status', 'confirmed').gte('check_in', today).order('check_in', { ascending: true }).limit(5),
  ])

  // Last 5 guest messages with reserva info
  const { data: msgs } = await db
    .from('mensajes_chat')
    .select('reserva_id, created_at, leido')
    .eq('sender', 'guest')
    .order('created_at', { ascending: false })
    .limit(5)

  let msgRows: any[] = []
  if (msgs && msgs.length > 0) {
    const ids = msgs.map((m: any) => m.reserva_id)
    const { data: msgReservas } = await db
      .from('reservas')
      .select('id, guest_name, apartment_slug')
      .in('id', ids)
    const rMap: Record<number, any> = {}
    for (const r of (msgReservas ?? [])) rMap[r.id] = r
    msgRows = msgs.map((m: any) => ({ ...m, reserva: rMap[m.reserva_id] })).filter((m: any) => m.reserva)
  }

  return {
    stats: {
      pending: pending.count ?? 0,
      unread: unread.count ?? 0,
      pagos: pagos.count ?? 0,
      llegadas: llegadas.count ?? 0,
    },
    ultimasReservas: (ultimasReservas.data ?? []) as any[],
    proximasLlegadas: (proximasLlegadas.data ?? []) as any[],
    ultimosMensajes: msgRows,
  }
}

const S_LABEL: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const S_COLOR: Record<string, string> = { pending: '#d97706', confirmed: '#4B766B', cancelled: '#9ca3af' }
const S_BG: Record<string, string> = { pending: '#fef3c7', confirmed: '#d1fae5', cancelled: '#f3f4f6' }

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
function fmtTime(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffH = (now.getTime() - date.getTime()) / 3600000
  if (diffH < 1) return 'Hace menos de 1h'
  if (diffH < 24) return `Hace ${Math.floor(diffH)}h`
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default async function AdminPage() {
  const { stats, ultimasReservas, proximasLlegadas, ultimosMensajes } = await getDashboardData()

  const cards = [
    { icon: MessageSquare, label: 'Inbox', sub: 'Mensajes sin leer', value: stats.unread, href: '/admin/inbox', color: '#3b82f6', bg: '#dbeafe' },
    { icon: Clock, label: 'Reservas', sub: 'Pendientes de gestión', value: stats.pending, href: '/admin/reservas?status=pending', color: '#d97706', bg: '#fef3c7' },
    { icon: CreditCard, label: 'Pagos', sub: 'Pendientes de cobro', value: stats.pagos, href: '/admin/pagos', color: '#8b5cf6', bg: '#ede9fe' },
    { icon: CalendarCheck, label: 'Calendario', sub: 'Llegadas esta semana', value: stats.llegadas, href: '/admin/calendario', color: '#4B766B', bg: '#d1fae5' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>
        <h1 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Dashboard</h1>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 28 }}>
          {cards.map(({ icon: Icon, label, sub, value, href, color, bg }) => (
            <Link key={label} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>{value}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{label}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 11, color: '#888' }}>{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>

          {/* Últimas solicitudes */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Últimas solicitudes</h2>
              <Link href="/admin/reservas" style={{ fontSize: 11, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>Ver todas →</Link>
            </div>
            {ultimasReservas.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin solicitudes</p>
            ) : ultimasReservas.map((r: any, i: number) => (
              <Link key={r.id} href={`/admin/reservas/${r.id}`} style={{ textDecoration: 'none', display: 'block', padding: '11px 18px', borderBottom: i < ultimasReservas.length - 1 ? '1px solid #f5f5f5' : undefined, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.guest_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{r.apartment_slug} · {fmtDate(r.check_in)} → {fmtDate(r.check_out)}</p>
                  </div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: S_BG[r.status], color: S_COLOR[r.status], flexShrink: 0 }}>
                    {S_LABEL[r.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Últimos mensajes */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Últimos mensajes</h2>
              <Link href="/admin/inbox" style={{ fontSize: 11, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>Ver todos →</Link>
            </div>
            {ultimosMensajes.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin mensajes</p>
            ) : ultimosMensajes.map((m: any, i: number) => (
              <Link key={m.reserva_id + '_' + m.created_at} href={`/admin/reservas/${m.reserva_id}#chat`} style={{ textDecoration: 'none', display: 'block', padding: '11px 18px', borderBottom: i < ultimosMensajes.length - 1 ? '1px solid #f5f5f5' : undefined, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.reserva?.guest_name}
                      {!m.leido && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', marginLeft: 6, verticalAlign: 'middle' }} />}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{m.reserva?.apartment_slug}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0 }}>{fmtTime(m.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Próximas llegadas */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Próximas llegadas</h2>
              <Link href="/admin/calendario" style={{ fontSize: 11, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>Calendario →</Link>
            </div>
            {proximasLlegadas.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Sin llegadas próximas</p>
            ) : proximasLlegadas.map((r: any, i: number) => (
              <Link key={r.id} href={`/admin/reservas/${r.id}`} style={{ textDecoration: 'none', display: 'block', padding: '11px 18px', borderBottom: i < proximasLlegadas.length - 1 ? '1px solid #f5f5f5' : undefined, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.guest_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{r.apartment_slug}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4B766B', flexShrink: 0 }}>
                    {new Date(r.check_in + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
