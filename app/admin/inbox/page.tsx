import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { MessageSquare, AlertCircle } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

type ConvRow = {
  reservaId: number
  guestName: string
  aptSlug: string
  lastTexto: string
  lastSender: 'guest' | 'admin'
  lastAt: string
  unread: number
  isUrgent: boolean
}

async function getInboxData(): Promise<ConvRow[]> {
  const [{ data: mensajes }, { data: reservas }] = await Promise.all([
    db.from('mensajes_chat').select('id, reserva_id, sender, texto, tipo, created_at, leido').order('created_at', { ascending: false }),
    db.from('reservas').select('id, guest_name, apartment_slug, status'),
  ])

  if (!mensajes || !reservas) return []

  const rMap: Record<number, any> = {}
  for (const r of reservas) rMap[r.id] = r

  // Group by reserva_id
  const grouped: Record<number, any[]> = {}
  for (const m of mensajes) {
    if (!grouped[m.reserva_id]) grouped[m.reserva_id] = []
    grouped[m.reserva_id].push(m)
  }

  const urgentThreshold = Date.now() - 48 * 60 * 60 * 1000
  const rows: ConvRow[] = []

  for (const [reservaId, msgs] of Object.entries(grouped)) {
    const rid = Number(reservaId)
    const reserva = rMap[rid]
    if (!reserva) continue

    const last = msgs[0] // already ordered DESC
    const unread = msgs.filter((m: any) => m.sender === 'guest' && !m.leido).length
    const lastPayReq = msgs.find((m: any) => m.tipo === 'payment_request')
    const isUrgent = !!lastPayReq && new Date(lastPayReq.created_at).getTime() < urgentThreshold

    rows.push({
      reservaId: rid,
      guestName: reserva.guest_name,
      aptSlug: reserva.apartment_slug,
      lastTexto: last.texto,
      lastSender: last.sender,
      lastAt: last.created_at,
      unread,
      isUrgent,
    })
  }

  // Sort by last message timestamp DESC
  rows.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
  return rows
}

function fmtTime(d: string) {
  const date = new Date(d)
  const now = new Date()
  const diffH = (now.getTime() - date.getTime()) / 3600000
  if (diffH < 1) return 'Hace <1h'
  if (diffH < 24) return `${Math.floor(diffH)}h`
  if (diffH < 48) return 'Ayer'
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default async function InboxPage() {
  const conversations = await getInboxData()

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Inbox</h1>
          {conversations.some(c => c.unread > 0) && (
            <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>
              {conversations.reduce((s, c) => s + c.unread, 0)} sin leer
            </span>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {conversations.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <MessageSquare size={32} color="#ddd" style={{ display: 'block', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: 14, color: '#bbb' }}>No hay conversaciones todavía</p>
            </div>
          )}
          {conversations.map((c, i) => (
            <Link
              key={c.reservaId}
              href={`/admin/reservas/${c.reservaId}#chat`}
              style={{
                display: 'block', textDecoration: 'none',
                padding: '14px 18px',
                borderBottom: i < conversations.length - 1 ? '1px solid #f5f5f5' : undefined,
                background: c.unread > 0 ? '#f8fbff' : '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: '#4B766B', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                }}>
                  {c.guestName.charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: c.unread > 0 ? 700 : 600, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.guestName}
                      </span>
                      <span style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>· {c.aptSlug}</span>
                      {c.isUrgent && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 6, padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          <AlertCircle size={9} /> Urgente
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{fmtTime(c.lastAt)}</span>
                      {c.unread > 0 && (
                        <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{
                    margin: 0, fontSize: 12, color: c.unread > 0 ? '#555' : '#999',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: c.unread > 0 ? 500 : 400,
                  }}>
                    {c.lastSender === 'admin' ? '→ ' : ''}{c.lastTexto}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
