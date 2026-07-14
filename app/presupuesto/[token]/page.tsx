import { notFound } from 'next/navigation'
import { getReservaByQuoteToken } from '@/app/actions/presupuesto'
import { CalendarDays, CheckCircle } from 'lucide-react'
import AceptarButton from './AceptarButton'

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

type Extra = { name: string; amount: number; quantity?: number; unit?: string }

export default async function PresupuestoPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const reserva = await getReservaByQuoteToken(token)
  if (!reserva) notFound()

  const nights =
    reserva.check_in && reserva.check_out
      ? Math.round((new Date(reserva.check_out).getTime() - new Date(reserva.check_in).getTime()) / 86400000)
      : null

  const total: number = reserva.total_price ?? 0
  const cleaningFee: number = reserva.cleaning_fee ?? 0
  const extras: Extra[] = reserva.extras ?? []
  const extrasTotal = extras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)
  const base = total - cleaningFee - extrasTotal

  const accepted = reserva.status === 'quote_accepted' || reserva.status === 'confirmed'
  const aptTitle = APT_NAMES[reserva.apartment_slug] || reserva.apartment_slug

  const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, color: '#555' }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}>
      <div style={{ background: '#4B766B', padding: '20px 20px 0' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5 }}>HolaMarBella!</p>
          <h1 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Presupuesto · {aptTitle}
          </h1>
          <div style={{ display: 'flex', gap: 20, paddingBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarDays size={13} style={{ opacity: 0.8 }} /> {fmtDate(reserva.check_in)}</span>
            <span>→ {fmtDate(reserva.check_out)}</span>
            {nights && <span>· {nights} noche{nights > 1 ? 's' : ''}</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px 40px' }}>

        {accepted && (
          <div style={{
            background: '#f0f9f6', border: '2px solid #4B766B', borderRadius: 12,
            padding: '20px', textAlign: 'center', marginBottom: 16,
          }}>
            <CheckCircle size={30} color="#4B766B" style={{ display: 'block', margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: 14, color: '#4B766B', fontWeight: 700 }}>Presupuesto ya aceptado — ¡gracias!</p>
          </div>
        )}

        {reserva.quote_message && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{reserva.quote_message}</p>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
              Desglose del presupuesto
            </p>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {nights ? (
              <div style={row}><span>Precio base ({nights} noches)</span><span>{base}€</span></div>
            ) : null}
            {cleaningFee > 0 && (
              <div style={row}><span>Gastos de limpieza</span><span>{cleaningFee}€</span></div>
            )}
            {extras.map((e, i) => (
              <div key={i} style={row}>
                <span>{e.name}{e.quantity && e.quantity > 1 ? ` (${e.quantity})` : ''}</span>
                <span>{e.amount * (e.quantity ?? 1)}€</span>
              </div>
            ))}
            <div style={{ ...row, borderTop: '2px solid #e2e8f0', marginTop: 6, paddingTop: 12, fontWeight: 700, fontSize: 16, color: '#4B766B' }}>
              <span>Total</span>
              <span>{total}€</span>
            </div>
          </div>
        </div>

        {!accepted && <AceptarButton token={token} />}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 24 }}>
          HolaMarBella! · Marbella, España
        </p>
      </div>
    </div>
  )
}
