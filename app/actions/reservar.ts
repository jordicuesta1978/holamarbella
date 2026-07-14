'use server'

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/lib/database.types'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateDailyBookingRef, getBookingRef } from '@/lib/booking-ref'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const MAR = process.env.MAR_EMAIL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://holamarbella.vercel.app'

const APT_NAMES_FALLBACK: Record<string, string> = {
  paloma: 'Apartamento Paloma', micu: 'Apartamento Micu', larysol: 'Apartamento Larysol',
  ami: 'Ático AMI', banesto: 'Ático Banesto',
}

function aptDisplay(slug: string): string {
  return APT_NAMES_FALLBACK[slug] || slug
}

export type ReservaInput = {
  apartmentSlug: string
  apartmentTitle: string
  nombre: string
  email: string
  telefono: string
  personas: number
  checkIn: string
  checkOut: string
  mensaje: string
}

type ReservaInputWithToken = ReservaInput & { conversationToken: string; bookingRef: string }

type NightBreakdown = { price: number; count: number }

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcTotalWithRanges(
  checkIn: string,
  checkOut: string,
  priceRanges: Array<{ fecha_inicio: string; fecha_fin: string; precio_noche: number }>,
  midPrice: number,
  cleaningFee: number,
): { total: number; breakdown: NightBreakdown[] } {
  const nights: number[] = []
  const s = new Date(checkIn + 'T00:00:00')
  const e = new Date(checkOut + 'T00:00:00')
  for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const key = toKey(d)
    let range: { fecha_inicio: string; fecha_fin: string; precio_noche: number } | undefined
    for (const p of priceRanges) {
      if (key >= p.fecha_inicio && key < p.fecha_fin) range = p
    }
    nights.push(range?.precio_noche ?? midPrice)
  }
  const base = nights.reduce((sum, p) => sum + p, 0)

  // Group consecutive nights with same price
  const breakdown: NightBreakdown[] = []
  for (const p of nights) {
    const last = breakdown[breakdown.length - 1]
    if (last && last.price === p) last.count++
    else breakdown.push({ price: p, count: 1 })
  }

  return { total: base + cleaningFee, breakdown }
}

export async function crearReserva(
  input: ReservaInput
): Promise<{ ok: true; token: string; bookingRef: string } | { ok: false; error: string }> {
  const conversationToken = crypto.randomUUID()

  // Fetch apartment data + price ranges before insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any
  const [{ data: aptData }, { data: priceRangesData }] = await Promise.all([
    db.from('apartments').select('price_min, price_max, cleaning_fee').eq('slug', input.apartmentSlug).single(),
    db.from('precios').select('fecha_inicio, fecha_fin, precio_noche').eq('apartment_slug', input.apartmentSlug).order('fecha_inicio'),
  ])

  const cleaningFee: number = aptData?.cleaning_fee ?? 40
  const midPrice: number = aptData ? Math.round((aptData.price_min + aptData.price_max) / 2) : 100
  const priceRanges: Array<{ fecha_inicio: string; fecha_fin: string; precio_noche: number }> = priceRangesData ?? []

  const { total: calculatedTotal, breakdown } = (input.checkIn && input.checkOut)
    ? calcTotalWithRanges(input.checkIn, input.checkOut, priceRanges, midPrice, cleaningFee)
    : { total: 0, breakdown: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any).from('reservas').insert({
    apartment_slug: input.apartmentSlug,
    guest_name: input.nombre,
    guest_email: input.email,
    guest_phone: input.telefono || null,
    check_in: input.checkIn,
    check_out: input.checkOut,
    guests: input.personas,
    status: 'pending',
    notes: input.mensaje,
    conversation_token: conversationToken,
    total_price: calculatedTotal > 0 ? calculatedTotal : null,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/admin/reservas')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted } = await (supabaseAdmin as any)
    .from('reservas')
    .select('id, created_at')
    .eq('conversation_token', conversationToken)
    .single()

  // Use check-in date for the booking ref
  const bookingRef = inserted
    ? await generateDailyBookingRef(inserted.id, input.apartmentSlug, input.checkIn)
    : ''

  if (inserted && bookingRef) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseAdmin as any).from('reservas').update({ booking_ref: bookingRef }).eq('id', inserted.id)
  }

  const inputWithToken: ReservaInputWithToken = { ...input, conversationToken, bookingRef }
  const displayTitle = input.apartmentTitle || aptDisplay(input.apartmentSlug)

  // priceCalc is used by email templates — use calculated values (already fetched above)
  const priceCalc = aptData ? {
    priceMin: aptData.price_min as number,
    priceMax: aptData.price_max as number,
    cleaningFee,
    totalPrice: calculatedTotal > 0 ? calculatedTotal : undefined,
    breakdown: breakdown.length > 0 ? breakdown : undefined,
  } : undefined

  const emailTasks: Promise<unknown>[] = [
    resend.emails.send({
      from: FROM,
      to: input.email,
      subject: '¡Solicitud recibida!',
      html: emailHuesped(inputWithToken, displayTitle, priceCalc),
    }),
  ]

  if (MAR) {
    emailTasks.push(
      resend.emails.send({
        from: FROM,
        to: MAR,
        subject: `🔔 Nueva solicitud — ${input.nombre} · ${displayTitle}`,
        html: emailMar(input, bookingRef, displayTitle, inserted?.id ?? 0, priceCalc),
      })
    )
  }

  await Promise.allSettled(emailTasks)

  return { ok: true, token: conversationToken, bookingRef }
}

function fmt(d: string): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function nightsLabel(a: string, b: string): string {
  if (!a || !b) return ''
  const n = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
  return n > 0 ? ` · ${n} noche${n > 1 ? 's' : ''}` : ''
}

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;">
      <tr>
        <td style="background:#4B766B;padding:28px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">HolaMarBella!</p>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;">
          ${content}
        </td>
      </tr>
      <tr>
        <td style="background:#F5F0E8;padding:24px 40px;text-align:center;border-top:1px solid #e8e0d0;">
          <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
            HolaMarbella · Marbella, España<br>
            © ${new Date().getFullYear()} Todos los derechos reservados
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function row(label: string, value: string, border = true): string {
  return `<tr>
    <td style="padding:12px 16px;background:#f9f7f4;width:38%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;${border ? 'border-top:1px solid #e8e0d0;' : ''}vertical-align:top;">${label}</td>
    <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;line-height:1.6;${border ? 'border-top:1px solid #e8e0d0;' : ''}">${value}</td>
  </tr>`
}

type PriceCalc = {
  priceMin: number
  priceMax: number
  cleaningFee: number
  totalPrice?: number
  breakdown?: NightBreakdown[]
}

function buildPriceRows(priceCalc: PriceCalc, nights: number): string {
  const cleaningFee = priceCalc.cleaningFee
  const total = priceCalc.totalPrice ?? 0

  let nightRows = ''
  if (priceCalc.breakdown && priceCalc.breakdown.length > 0) {
    for (const g of priceCalc.breakdown) {
      const subtotal = g.price * g.count
      nightRows += `<tr><td style="padding:4px 0;font-size:14px;color:#555;">${g.price}€/noche × ${g.count} noche${g.count > 1 ? 's' : ''}</td><td align="right" style="font-size:14px;color:#1A1A1A;font-weight:600;">${subtotal}€</td></tr>`
    }
  } else {
    const midPrice = Math.round((priceCalc.priceMin + priceCalc.priceMax) / 2)
    const subtotal = midPrice * nights
    nightRows = `<tr><td style="padding:4px 0;font-size:14px;color:#555;">${midPrice}€/noche × ${nights} noche${nights > 1 ? 's' : ''}</td><td align="right" style="font-size:14px;color:#1A1A1A;font-weight:600;">${subtotal}€</td></tr>`
  }

  return `
    <div style="background:#f0f9f6;border:1.5px solid #4B766B;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4B766B;">Precio estimado</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${nightRows}
        <tr><td style="padding:4px 0;font-size:14px;color:#555;">Gastos de limpieza</td><td align="right" style="font-size:14px;color:#1A1A1A;font-weight:600;">${cleaningFee}€</td></tr>
        <tr><td colspan="2" style="border-top:1px solid #b2d4cc;padding-top:8px;"></td></tr>
        <tr><td style="padding-top:4px;font-size:16px;font-weight:700;color:#1A1A1A;">Total estimado</td><td align="right" style="font-size:16px;font-weight:800;color:#4B766B;">${total}€</td></tr>
      </table>
      <p style="margin:10px 0 0;font-size:11px;color:#888;">* El precio exacto será confirmado al revisar tu solicitud.</p>
    </div>`
}

function emailHuesped(d: ReservaInputWithToken, displayTitle: string, priceCalc?: PriceCalc): string {
  const firstName = d.nombre.split(' ')[0]
  const nights = d.checkIn && d.checkOut
    ? Math.round((new Date(d.checkOut).getTime() - new Date(d.checkIn).getTime()) / 86400000)
    : 0

  const priceSection = priceCalc && nights > 0 && priceCalc.totalPrice ? buildPriceRows(priceCalc, nights) : ''

  return shell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#4B766B;">¡Solicitud recibida!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      Hola <strong style="color:#1A1A1A;">${firstName}</strong>, hemos recibido tu solicitud para
      <strong style="color:#1A1A1A;">${displayTitle}</strong>.
      Revisaremos tu petición y nos pondremos en contacto contigo lo antes posible.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      ${row('Apartamento', `<strong>${displayTitle}</strong>`, false)}
      ${d.bookingRef ? row('Referencia', `<strong style="font-family:monospace;letter-spacing:1px;">${d.bookingRef}</strong>`) : ''}
      ${row('Llegada', fmt(d.checkIn))}
      ${row('Salida', `${fmt(d.checkOut)}${nightsLabel(d.checkIn, d.checkOut)}`)}
      ${row('Personas', `${d.personas} persona${d.personas > 1 ? 's' : ''}`)}
      ${row('Tu mensaje', d.mensaje.replace(/\n/g, '<br>'))}
    </table>

    ${priceSection}

    <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
      ¿Tienes dudas? Responde directamente a este email.
    </p>
  `)
}

function emailMar(d: ReservaInput, bookingRef: string, displayTitle: string, reservaId: number, priceCalc?: PriceCalc): string {
  const fecha = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const adminLink = `${BASE_URL}/admin/reservas/${reservaId}`
  const nightsStr = nightsLabel(d.checkIn, d.checkOut).replace(' · ', '')
  const nights = d.checkIn && d.checkOut
    ? Math.round((new Date(d.checkOut).getTime() - new Date(d.checkIn).getTime()) / 86400000)
    : 0

  const total = priceCalc?.totalPrice
  const cleaningFee = priceCalc?.cleaningFee ?? 40

  // Build compact price string for the table row
  let estimatedPrice = ''
  if (priceCalc && total && nights > 0) {
    if (priceCalc.breakdown && priceCalc.breakdown.length > 1) {
      const parts = priceCalc.breakdown.map(g => `${g.price}€×${g.count}`).join(' + ')
      estimatedPrice = `<strong style="font-size:16px;">${total}€</strong> <span style="font-size:12px;color:#888;">(${parts} + ${cleaningFee}€ limpieza)</span>`
    } else {
      const midPrice = Math.round((priceCalc.priceMin + priceCalc.priceMax) / 2)
      estimatedPrice = `<strong style="font-size:16px;">${total}€</strong> <span style="font-size:12px;color:#888;">(${midPrice}€/n × ${nights} noches + ${cleaningFee}€ limpieza)</span>`
    }
  }

  return shell(`
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#4B766B;">Nueva solicitud de reserva</h1>
    <p style="margin:0 0 28px;font-size:13px;color:#999;">${fecha}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      ${row('Apartamento', `<strong>${displayTitle}</strong>`, false)}
      ${bookingRef ? row('Referencia', `<strong style="font-family:monospace;letter-spacing:1px;">${bookingRef}</strong>`) : ''}
      ${row('Huésped', d.nombre)}
      ${row('Email', `<a href="mailto:${d.email}" style="color:#4B766B;text-decoration:none;">${d.email}</a>`)}
      ${row('Teléfono', d.telefono || '—')}
      ${row('Llegada', fmt(d.checkIn))}
      ${row('Salida', `${fmt(d.checkOut)}${nightsLabel(d.checkIn, d.checkOut)}`)}
      ${nightsStr ? row('Duración', nightsStr) : ''}
      ${row('Personas', `${d.personas}`)}
      ${estimatedPrice ? row('Precio estimado', estimatedPrice) : ''}
    </table>

    <div style="background:#F5F0E8;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Mensaje del huésped</p>
      <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.7;white-space:pre-wrap;">${d.mensaje}</p>
    </div>

    ${reservaId ? `<div style="text-align:center;">
      <a href="${adminLink}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ver reserva en admin →</a>
    </div>` : ''}
  `)
}
