import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import ReservaActions from './ReservaActions'
import PricingPanel from './PricingPanel'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { getBookingRef } from '@/lib/booking-ref'
import { getPriceRanges } from '@/lib/db'

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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', quote_sent: 'Presupuesto enviado', quote_accepted: 'Presupuesto aceptado',
  confirmed: 'Confirmada', cancelled: 'Cancelada',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#d97706', quote_sent: '#2563eb', quote_accepted: '#7c3aed',
  confirmed: '#4B766B', cancelled: '#9ca3af',
}
const STATUS_BG: Record<string, string> = {
  pending: '#fef3c7', quote_sent: '#dbeafe', quote_accepted: '#ede9fe',
  confirmed: '#d1fae5', cancelled: '#f3f4f6',
}

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const reserva = await getReserva(Number(id))
  if (!reserva) notFound()

  const [aptPrices, priceRanges] = await Promise.all([
    getApartmentPrices(reserva.apartment_slug),
    getPriceRanges(reserva.apartment_slug).catch(() => []),
  ])

  const nights =
    reserva.check_in && reserva.check_out
      ? Math.round((new Date(reserva.check_out).getTime() - new Date(reserva.check_in).getTime()) / 86400000)
      : null

  // Build mailto URL for "Contactar cliente"
  const APT_NAMES: Record<string, string> = {
    paloma: 'Apartamento Paloma', micu: 'Apartamento Micu', larysol: 'Apartamento Larysol',
    ami: 'Ático AMI', banesto: 'Ático Banesto',
  }
  const aptName = APT_NAMES[reserva.apartment_slug] || reserva.apartment_slug
  const bookingRef = reserva.booking_ref || getBookingRef(reserva.id, reserva.apartment_slug, reserva.check_in ?? reserva.created_at)
  const firstName = (reserva.guest_name as string).split(' ')[0]
  const midPrice = Math.round((aptPrices.price_min + aptPrices.price_max) / 2)
  const estimatedTotal = nights ? nights * midPrice + (reserva.cleaning_fee ?? 40) : null

  const mailSubject = `Reserva ${bookingRef} - ${aptName} · ${fmt(reserva.check_in)} → ${fmt(reserva.check_out)}`
  const mailBody = [
    `Hola ${firstName},`,
    '',
    'Te escribimos en relación a tu solicitud de reserva:',
    '',
    `Apartamento: ${aptName}`,
    `Referencia: ${bookingRef}`,
    `Llegada: ${fmt(reserva.check_in)}`,
    `Salida: ${fmt(reserva.check_out)}`,
    nights ? `Duración: ${nights} noche${nights > 1 ? 's' : ''}` : '',
    estimatedTotal ? `Precio estimado: ${estimatedTotal}€` : '',
    '',
    '',
    'Un saludo,',
    'Mar Diez',
  ].filter(l => l !== undefined).join('\n')
  const gmailComposeHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(reserva.guest_email)}&su=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <Link href="/admin/reservas" style={{ fontSize: 13, color: '#4B766B', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 20 }}>← Volver</Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>
            {bookingRef}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[reserva.status], color: STATUS_COLOR[reserva.status] }}>
              {STATUS_LABEL[reserva.status]}
            </span>
            <a
              href={gmailComposeHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#4B766B', color: '#fff', textDecoration: 'none',
                borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              ✉ Contactar cliente
            </a>
          </div>
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
            ['Apartamento', (() => {
              const APT_NAMES: Record<string, string> = { paloma: 'Apartamento Paloma', micu: 'Apartamento Micu', larysol: 'Apartamento Larysol', ami: 'Ático AMI', banesto: 'Ático Banesto' }
              return APT_NAMES[reserva.apartment_slug] || reserva.apartment_slug
            })()],
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

        {/* Resumen de pagos */}
        {reserva.total_price && (
          <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
              <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Pagos</h2>
            </div>
            {([
              ['Total reserva', `${reserva.total_price}€`],
              reserva.paid_at
                ? ['Pagado', `${reserva.total_price}€ · ${new Date(reserva.paid_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`]
                : null,
              !reserva.paid_at ? ['Pendiente', `${reserva.total_price}€`] : null,
            ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', gap: 16 }}>
                <span style={{ width: 160, flexShrink: 0, fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: label === 'Pagado' ? '#4B766B' : label === 'Pendiente' ? '#d97706' : '#1a1a2e',
                }}>{value}</span>
              </div>
            ))}
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
          initialDepositPaid={reserva.deposit_paid ?? 0}
          priceRanges={priceRanges}
          checkIn={reserva.check_in ?? undefined}
          checkOut={reserva.check_out ?? undefined}
          initialQuoteMessage={reserva.quote_message ?? ''}
          quoteStatus={reserva.status}
          quoteSentAt={reserva.quote_sent_at}
          quoteAcceptedAt={reserva.quote_accepted_at}
        />

        {/* Actions */}
        {['pending', 'quote_sent', 'quote_accepted'].includes(reserva.status) && (
          <ReservaActions id={reserva.id} status={reserva.status} depositPaid={reserva.deposit_paid ?? 0} />
        )}

        {['confirmed', 'cancelled'].includes(reserva.status) && (
          <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center' }}>Esta reserva ya fue procesada.</p>
        )}
      </div>
    </div>
  )
}
