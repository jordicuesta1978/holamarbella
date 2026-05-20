import { notFound } from 'next/navigation'
import { getConversacionByToken, marcarMensajesLeidos } from '@/app/actions/mensajes'
import { CreditCard } from 'lucide-react'
import GuestChatInput from './GuestChatInput'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtHora(d: string) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
function fmtFecha(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default async function ConversacionPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getConversacionByToken(token)
  if (!data) notFound()

  const { reserva, mensajes } = data

  // Mark admin messages as read when guest opens the conversation
  await marcarMensajesLeidos(reserva.id, 'admin')

  const nights =
    reserva.check_in && reserva.check_out
      ? Math.round((new Date(reserva.check_out).getTime() - new Date(reserva.check_in).getTime()) / 86400000)
      : null

  // Find last pending payment request
  const lastPayment = [...mensajes].reverse().find(
    m => m.tipo === 'payment_request' && m.sender === 'admin'
  )

  let lastDate = ''

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#4B766B', padding: '20px 20px 0' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5 }}>HolaMarBella!</p>
          <h1 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Tu reserva · {reserva.apartment_slug}
          </h1>
          <div style={{ display: 'flex', gap: 20, paddingBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
            <span>📅 {fmtDate(reserva.check_in)}</span>
            <span>→ {fmtDate(reserva.check_out)}</span>
            {nights && <span>· {nights} noche{nights > 1 ? 's' : ''}</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 40px' }}>
        {/* Payment request banner */}
        {lastPayment && lastPayment.payment_amount && (
          <div style={{
            background: '#fff', border: '2px solid #4B766B', borderTop: 'none',
            borderRadius: '0 0 12px 12px', padding: '20px',
            marginBottom: 0, textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <CreditCard size={18} color="#4B766B" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#4B766B' }}>Solicitud de pago pendiente</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#1a1a2e' }}>{lastPayment.payment_amount}€</p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>Importe total de tu reserva</p>
            <button
              disabled
              style={{
                background: '#4B766B', color: '#fff', border: 'none',
                borderRadius: 10, padding: '12px 28px', fontSize: 14,
                fontWeight: 700, cursor: 'not-allowed', opacity: 0.7, width: '100%',
              }}
            >
              Pagar {lastPayment.payment_amount}€ — Próximamente
            </button>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#bbb' }}>El pago online estará disponible en breve</p>
          </div>
        )}

        {/* Chat */}
        <div style={{ background: '#fff', borderRadius: lastPayment ? '0 0 12px 12px' : 12, border: '1px solid #e2e8f0', marginTop: lastPayment ? 0 : 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
              Conversación
            </p>
          </div>

          <div style={{ minHeight: 200, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, background: '#fafafa' }}>
            {mensajes.length === 0 && (
              <p style={{ textAlign: 'center', color: '#bbb', fontSize: 14, padding: '32px 0' }}>
                Aún no hay mensajes en esta conversación.
              </p>
            )}
            {mensajes.map((m) => {
              const dateStr = fmtFecha(m.created_at)
              const showDate = dateStr !== lastDate
              lastDate = dateStr
              const isAdmin = m.sender === 'admin'

              return (
                <div key={m.id}>
                  {showDate && (
                    <div style={{ textAlign: 'center', margin: '8px 0 4px' }}>
                      <span style={{ fontSize: 11, color: '#aaa', background: '#f0f0f0', borderRadius: 20, padding: '2px 10px' }}>{dateStr}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-start' : 'flex-end', marginBottom: 2 }}>
                    {m.tipo === 'payment_request' ? (
                      <div style={{ background: '#f0f9f6', border: '1.5px solid #4B766B', borderRadius: 12, padding: '12px 16px', maxWidth: '80%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <CreditCard size={13} color="#4B766B" />
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4B766B' }}>Solicitud de pago</span>
                        </div>
                        {m.payment_amount && (
                          <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{m.payment_amount}€</p>
                        )}
                        <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{fmtHora(m.created_at)}</p>
                      </div>
                    ) : (
                      <div style={{
                        background: isAdmin ? '#fff' : '#4B766B',
                        color: isAdmin ? '#1a1a2e' : '#fff',
                        borderRadius: isAdmin ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                        padding: '10px 14px',
                        maxWidth: '80%',
                        border: isAdmin ? '1px solid #e2e8f0' : 'none',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}>
                        {isAdmin && (
                          <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4B766B' }}>HolaMarbella</p>
                        )}
                        <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.texto}</p>
                        <p style={{ margin: 0, fontSize: 10, opacity: 0.5, textAlign: 'right' }}>{fmtHora(m.created_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <GuestChatInput token={token} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 20 }}>
          HolaMarBella! · Marbella, España · Esta es tu conversación privada
        </p>
      </div>
    </div>
  )
}
