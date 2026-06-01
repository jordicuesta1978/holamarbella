import { notFound } from 'next/navigation'
import { getConversacionByToken } from '@/app/actions/mensajes'
import { CreditCard, CheckCircle, Clock, XCircle, CalendarDays } from 'lucide-react'
import PagoButton from './PagoButton'

const APT_NAMES: Record<string, string> = {
  paloma: 'Apartamento Paloma',
  micu: 'Apartamento Micu',
  larysol: 'Apartamento Larysol',
  ami: 'Ático AMI',
  banesto: 'Ático Banesto',
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente — revisando tu solicitud',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = { pending: '#d97706', confirmed: '#4B766B', cancelled: '#9ca3af' }
const STATUS_BG: Record<string, string> = { pending: '#fef3c7', confirmed: '#d1fae5', cancelled: '#fee2e2' }
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  confirmed: <CheckCircle size={14} />,
  cancelled: <XCircle size={14} />,
}

export default async function ConversacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ pago?: string }>
}) {
  const [{ token }, { pago }] = await Promise.all([params, searchParams])
  const data = await getConversacionByToken(token)
  if (!data) notFound()

  const { reserva, mensajes } = data

  const nights =
    reserva.check_in && reserva.check_out
      ? Math.round((new Date(reserva.check_out).getTime() - new Date(reserva.check_in).getTime()) / 86400000)
      : null

  const isPaid = !!(reserva as any).paid_at
  const pagoOk = pago === 'ok'

  const lastPayment = [...mensajes].reverse().find(
    m => m.tipo === 'payment_request' && m.sender === 'admin'
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#4B766B', padding: '20px 20px 0' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5 }}>HolaMarBella!</p>
          <h1 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Tu reserva · {APT_NAMES[reserva.apartment_slug] || reserva.apartment_slug}
          </h1>
          <div style={{ display: 'flex', gap: 20, paddingBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarDays size={13} style={{ opacity: 0.8 }} /> {fmtDate(reserva.check_in)}</span>
            <span>→ {fmtDate(reserva.check_out)}</span>
            {nights && <span>· {nights} noche{nights > 1 ? 's' : ''}</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px 40px' }}>

        {/* Success banner after payment */}
        {pagoOk && (
          <div style={{
            background: '#f0f9f6', border: '2px solid #4B766B', borderRadius: 12,
            padding: '24px', textAlign: 'center', marginBottom: 16,
          }}>
            <CheckCircle size={36} color="#4B766B" style={{ display: 'block', margin: '0 auto 10px' }} />
            <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#4B766B' }}>¡Pago recibido!</p>
            <p style={{ margin: 0, fontSize: 13, color: '#666' }}>Hemos recibido tu pago. El gestor revisará y confirmará tu reserva en breve.</p>
          </div>
        )}

        {/* Reservation details */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
              Estado de tu reserva
            </p>
          </div>
          {[
            ['Estado', (
              <span key="s" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: STATUS_BG[(reserva as any).status], color: STATUS_COLOR[(reserva as any).status],
              }}>
                {STATUS_ICON[(reserva as any).status]}
                {STATUS_LABEL[(reserva as any).status]}
              </span>
            )],
            ['Huésped', reserva.guest_name],
            ['Apartamento', APT_NAMES[reserva.apartment_slug] || reserva.apartment_slug],
            ['Llegada', fmtDate(reserva.check_in)],
            ['Salida', fmtDate(reserva.check_out)],
            nights ? ['Duración', `${nights} noche${nights > 1 ? 's' : ''}`] : null,
          ].filter((row): row is [React.ReactNode, React.ReactNode] => row !== null).map(([label, value]) => (
            <div key={String(label)} style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', gap: 16 }}>
              <span style={{ width: 110, flexShrink: 0, fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{value as React.ReactNode}</span>
            </div>
          ))}
        </div>

        {/* Payment request */}
        {!pagoOk && lastPayment && lastPayment.payment_amount && (
          <div style={{
            background: '#fff', border: '2px solid #4B766B',
            borderRadius: 12, padding: '24px', textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <CreditCard size={18} color="#4B766B" />
              <span style={{ fontWeight: 700, fontSize: 14, color: isPaid ? '#4B766B' : '#1a1a2e' }}>
                {isPaid ? 'Reserva pagada' : 'Solicitud de pago pendiente'}
              </span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 800, color: '#1a1a2e' }}>{lastPayment.payment_amount}€</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>Importe total de tu reserva</p>
            {isPaid ? (
              <div style={{
                background: '#4B766B', color: '#fff',
                borderRadius: 10, padding: '12px 28px', fontSize: 14,
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <CheckCircle size={16} /> Pagado — ¡Gracias!
              </div>
            ) : (
              <PagoButton token={token} amount={lastPayment.payment_amount} />
            )}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 24 }}>
          HolaMarBella! · Marbella, España
        </p>
      </div>
    </div>
  )
}
