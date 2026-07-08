import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from './AdminNavServer'
import DashboardRefresh from './DashboardRefresh'
import AdminTour from '@/components/AdminTour'
import { CalendarDays, BookOpen, Users } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

const APT_NAMES: Record<string, string> = {
  paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
}

async function getDashboardData() {
  const [ultimasReservas, ultimosRegistros] = await Promise.all([
    db.from('reservas')
      .select('id, guest_name, apartment_slug, check_in, check_out, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    db.from('registros_viajeros')
      .select('id, nombre, apellidos, apartment_slug, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return {
    ultimasReservas: (ultimasReservas.data ?? []) as any[],
    ultimosRegistros: (ultimosRegistros.data ?? []) as any[],
  }
}

const S_LABEL: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const S_COLOR: Record<string, string> = { pending: '#d97706', confirmed: '#4B766B', cancelled: '#9ca3af' }
const S_BG: Record<string, string> = { pending: '#fef3c7', confirmed: '#d1fae5', cancelled: '#f3f4f6' }

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function fmtDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function AdminPage() {
  const { ultimasReservas, ultimosRegistros } = await getDashboardData()

  const quickActions = [
    {
      icon: CalendarDays,
      label: 'Gestionar disponibilidad',
      desc: 'Bloquear fechas y actualizar calendario',
      href: '/admin/contenido?tab=disponibilidad',
      iconColor: '#4B766B',
      iconBg: '#d1fae5',
    },
    {
      icon: BookOpen,
      label: 'Ver reservas',
      desc: 'Gestionar solicitudes y confirmaciones',
      href: '/admin/reservas',
      iconColor: '#1e40af',
      iconBg: '#dbeafe',
    },
    {
      icon: Users,
      label: 'Registros de viajeros',
      desc: 'Consultar y verificar datos de huéspedes',
      href: '/admin/registros',
      iconColor: '#7c3aed',
      iconBg: '#ede9fe',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminTour />
      <AdminNavServer />
      <DashboardRefresh />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Dashboard</h1>

        {/* Sección 1 — Acciones rápidas */}
        <section data-tour="stats" style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
            Acciones rápidas
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quickActions.map(({ icon: Icon, label, desc, href, iconColor, iconBg }) => (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '16px 18px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  minHeight: 76,
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 13,
                    background: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={24} color={iconColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888', lineHeight: 1.4 }}>{desc}</p>
                  </div>
                  <span style={{ color: '#d1d5db', fontSize: 20, flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección 2 — Últimas solicitudes */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
              Últimas solicitudes
            </h2>
            <Link href="/admin/reservas" style={{ fontSize: 12, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>
              Ver todas →
            </Link>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {ultimasReservas.length === 0 ? (
              <p style={{ padding: '28px', textAlign: 'center', color: '#bbb', fontSize: 13, margin: 0 }}>Sin solicitudes</p>
            ) : ultimasReservas.map((r: any, i: number) => (
              <Link
                key={r.id}
                href={`/admin/reservas/${r.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  padding: '14px 18px',
                  borderBottom: i < ultimasReservas.length - 1 ? '1px solid #f5f5f5' : undefined,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.guest_name}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
                      {APT_NAMES[r.apartment_slug] ?? r.apartment_slug} · {fmtDate(r.check_in)} → {fmtDate(r.check_out)}
                    </p>
                  </div>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: S_BG[r.status] ?? '#f3f4f6',
                    color: S_COLOR[r.status] ?? '#888',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {S_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sección 3 — Últimos registros de viajeros */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
              Últimos registros de viajeros
            </h2>
            <Link href="/admin/registros" style={{ fontSize: 12, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>
              Ver todos →
            </Link>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {ultimosRegistros.length === 0 ? (
              <p style={{ padding: '28px', textAlign: 'center', color: '#bbb', fontSize: 13, margin: 0 }}>Sin registros</p>
            ) : ultimosRegistros.map((r: any, i: number) => (
              <Link
                key={r.id}
                href={`/admin/registros/${r.id}`}
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  padding: '14px 18px',
                  borderBottom: i < ultimosRegistros.length - 1 ? '1px solid #f5f5f5' : undefined,
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.nombre} {r.apellidos}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#888' }}>
                      {APT_NAMES[r.apartment_slug] ?? r.apartment_slug ?? '—'}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {fmtDateTime(r.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
