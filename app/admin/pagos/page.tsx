import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from '@/app/admin/AdminNavServer'
import SolicitarPagoBtn from './SolicitarPagoBtn'
import { CreditCard } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

type PagoRow = {
  id: number
  guestName: string
  aptSlug: string
  checkIn: string
  checkOut: string
  nights: number
  totalPrice: number
  lastPayReqAt: string | null
}

async function getPagosData(): Promise<PagoRow[]> {
  const [{ data: reservas }, { data: payReqs }] = await Promise.all([
    db.from('reservas')
      .select('id, guest_name, apartment_slug, check_in, check_out, total_price')
      .eq('status', 'confirmed')
      .not('total_price', 'is', null)
      .order('created_at', { ascending: false }),
    db.from('mensajes_chat')
      .select('reserva_id, created_at')
      .eq('tipo', 'payment_request')
      .order('created_at', { ascending: false }),
  ])

  if (!reservas) return []

  // Build latest payment request per reserva
  const lastPayReq: Record<number, string> = {}
  for (const m of (payReqs ?? [])) {
    if (!lastPayReq[m.reserva_id]) lastPayReq[m.reserva_id] = m.created_at
  }

  return reservas.map((r: any) => {
    const nights = r.check_in && r.check_out
      ? Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)
      : 0
    return {
      id: r.id,
      guestName: r.guest_name,
      aptSlug: r.apartment_slug,
      checkIn: r.check_in,
      checkOut: r.check_out,
      nights,
      totalPrice: r.total_price,
      lastPayReqAt: lastPayReq[r.id] ?? null,
    }
  })
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtRelative(d: string | null) {
  if (!d) return null
  const h = (Date.now() - new Date(d).getTime()) / 3600000
  if (h < 1) return 'Hace menos de 1h'
  if (h < 24) return `Hace ${Math.floor(h)}h`
  const days = Math.floor(h / 24)
  return `Hace ${days} día${days > 1 ? 's' : ''}`
}

export default async function PagosPage() {
  const pagos = await getPagosData()
  const urgentThreshold = Date.now() - 48 * 60 * 60 * 1000

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Pagos pendientes</h1>
          {pagos.length > 0 && (
            <span style={{ background: '#8b5cf6', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>{pagos.length}</span>
          )}
        </div>

        {pagos.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center' }}>
            <CreditCard size={32} color="#ddd" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 14, color: '#bbb' }}>No hay pagos pendientes</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pagos.map(p => {
              const isUrgent = p.lastPayReqAt && new Date(p.lastPayReqAt).getTime() < urgentThreshold
              return (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: 12,
                  border: `1px solid ${isUrgent ? '#fca5a5' : '#e2e8f0'}`,
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{p.guestName}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>· {p.aptSlug}</span>
                      {isUrgent && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 6, padding: '1px 6px' }}>
                          +48h sin pago
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                      {fmtDate(p.checkIn)} → {fmtDate(p.checkOut)} · {p.nights} noche{p.nights !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: 'right', minWidth: 100 }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#4B766B' }}>{p.totalPrice}€</p>
                    {p.lastPayReqAt ? (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa' }}>
                        Solicitado {fmtRelative(p.lastPayReqAt)}
                      </p>
                    ) : (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#d97706' }}>Sin solicitar</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <SolicitarPagoBtn reservaId={p.id} amount={p.totalPrice} />
                    <Link href={`/admin/reservas/${p.id}#chat`} style={{
                      fontSize: 12, color: '#4B766B', fontWeight: 600,
                      textDecoration: 'none', padding: '7px 14px',
                      border: '1px solid #4B766B', borderRadius: 8,
                      whiteSpace: 'nowrap',
                    }}>
                      Ver chat →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
