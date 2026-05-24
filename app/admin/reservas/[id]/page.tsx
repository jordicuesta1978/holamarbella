import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import ReservaActions from './ReservaActions'
import PricingPanel from './PricingPanel'
import ChatPanel from './ChatPanel'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { getMensajesReserva, marcarMensajesLeidos } from '@/app/actions/mensajes'
import { getBookingRef } from '@/lib/booking-ref'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getReserva(id: number): Promise<any | null> {
  const { data } = await supabaseAdmin
    .from('reservas')
    .select('*')
    .eq('id', id)
    .single()
  return data ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getApartmentPrices(slug: string): Promise<{ price_min: number; price_max: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabaseAdmin as any).from('apartments').select('price_min, price_max').eq('slug', slug).single()
  return data ?? { price_min: 80, price_max: 160 }
}

function fmt(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDatetime(d: string) {
  return new Date(d).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_LABEL: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const STATUS_COLOR: Record<string, string> = { pending: '#d97706', confirmed: '#4B766B', cancelled: '#9ca3af' }
const STATUS_BG: Record<string, string> = { pending: '#fef3c7', confirmed: '#d1fae5', cancelled: '#f3f4f6' }

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const reserva = await getReserva(Number(id))
  if (!reserva) notFound()

  const [aptPrices, mensajes] = await Promise.all([
    getApartmentPrices(reserva.apartment_slug),
    getMensajesReserva(Number(id)),
  ])
  // Mark guest messages as read when admin opens the chat
  await marcarMensajesLeidos(Number(id), 'guest')

  const nights =
    reserva.check_in && reserva.check_out
      ? Math.round((new Date(reserva.check_out).getTime() - new Date(reserva.check_in).getTime()) / 86400000)
      : null

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/admin/reservas" style={{ fontSize: 13, color: '#4B766B', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Volver</Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
            {reserva.booking_ref || getBookingRef(reserva.id, reserva.apartment_slug, reserva.check_in ?? reserva.created_at)}
          </h1>
          <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[reserva.status], color: STATUS_COLOR[reserva.status] }}>
            {STATUS_LABEL[reserva.status]}
          </span>
        </div>

        {/* Datos del huésped */}
        <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Huésped</h2>
          </div>
          {[
            ['Nombre', reserva.guest_name],
            ['Email', <a key="e" href={`mailto:${reserva.guest_email}`} style={{ color: '#4B766B', textDecoration: 'none' }}>{reserva.guest_email}</a>],
            ['Teléfono', reserva.guest_phone ?? '—'],
            ['Solicitud recibida', fmtDatetime(reserva.created_at)],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', gap: 16 }}>
              <span style={{ width: 160, flexShrink: 0, fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </section>

        {/* Estancia */}
        <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Estancia</h2>
          </div>
          {[
            ['Apartamento', reserva.apartment_slug],
            ['Llegada', fmt(reserva.check_in)],
            ['Salida', fmt(reserva.check_out)],
            ['Duración', nights ? `${nights} noche${nights > 1 ? 's' : ''}` : '—'],
            ['Personas', String(reserva.guests)],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', gap: 16 }}>
              <span style={{ width: 160, flexShrink: 0, fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </section>

        {/* Mensaje */}
        {reserva.notes && (
          <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Mensaje del huésped</h2>
            </div>
            <div style={{ padding: '16px 20px', fontSize: 14, color: '#1a1a2e', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{reserva.notes}</div>
          </section>
        )}

        {/* Pricing */}
        <PricingPanel
          id={reserva.id}
          nights={nights ?? 0}
          priceMin={aptPrices.price_min}
          priceMax={aptPrices.price_max}
          initialCleaningFee={reserva.cleaning_fee ?? 40}
          initialExtras={reserva.extras ?? []}
          initialTotal={reserva.total_price}
        />

        {/* Chat */}
        <ChatPanel
          reservaId={reserva.id}
          initialMensajes={mensajes}
          totalPrice={reserva.total_price ?? null}
          guestName={reserva.guest_name}
        />

        {/* Actions */}
        {reserva.status === 'pending' && (
          <ReservaActions id={reserva.id} />
        )}

        {reserva.status !== 'pending' && (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center' }}>Esta reserva ya fue procesada.</p>
        )}
      </div>
    </div>
  )
}
