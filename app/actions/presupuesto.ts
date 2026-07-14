'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import type { Extra } from './admin'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const MAR = process.env.MAR_EMAIL
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://holamarbella.vercel.app'

const db = supabaseAdmin as any

const APT_NAMES: Record<string, string> = {
  paloma: 'Apartamento Paloma', micu: 'Apartamento Micu', larysol: 'Apartamento Larysol',
  ami: 'Ático AMI', banesto: 'Ático Banesto',
}

function fmt(d: string | null): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function shell(content: string) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#4B766B;padding:28px 40px;text-align:center;">
  <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">HolaMarBella!</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">${content}</td></tr>
<tr><td style="background:#F5F0E8;padding:24px 40px;text-align:center;border-top:1px solid #e8e0d0;">
  <p style="margin:0;font-size:12px;color:#999;">HolaMarBella! · Marbella, España · © ${new Date().getFullYear()}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

function pricingHtml(r: any): string {
  const nights =
    r.check_in && r.check_out
      ? Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)
      : 0
  const extras: Extra[] = r.extras ?? []
  const cleaningFee: number = r.cleaning_fee ?? 0
  const extrasTotal = extras.reduce((s: number, e: Extra) => s + e.amount * (e.quantity ?? 1), 0)
  const total = r.total_price ?? 0
  const base = total - cleaningFee - extrasTotal

  const tdL = `style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;border-top:1px solid #e8e0d0;"`
  const tdR = `style="padding:8px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #e8e0d0;text-align:right;"`
  const tdRBold = `style="padding:10px 16px;font-size:14px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;text-align:right;"`
  const tdLBold = `style="padding:10px 16px;background:#f9f7f4;font-size:13px;font-weight:700;color:#4B766B;border-top:2px solid #e8e0d0;"`

  const extraRows = extras.map((e: Extra) => {
    const qty = e.quantity && e.quantity > 1 ? ` · ${e.quantity} ${e.unit ?? 'uds'}` : ''
    return `<tr><td ${tdL}>${e.name}${qty}</td><td ${tdR}>${e.amount * (e.quantity ?? 1)}€</td></tr>`
  }).join('')

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin:20px 0 24px;">
    <tr>
      <td style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;">
        Precio base${nights > 0 ? ` · ${nights} noche${nights > 1 ? 's' : ''}` : ''}
      </td>
      <td style="padding:8px 16px;font-size:13px;color:#1A1A1A;text-align:right;">${base}€</td>
    </tr>
    ${cleaningFee > 0 ? `<tr><td ${tdL}>Gastos de limpieza</td><td ${tdR}>${cleaningFee}€</td></tr>` : ''}
    ${extraRows}
    <tr><td ${tdLBold}>Total</td><td ${tdRBold}>${total}€</td></tr>
  </table>`
}

function quoteHtml(r: any, aptTitle: string, message: string, link: string) {
  const firstName = (r.guest_name as string).split(' ')[0]
  return shell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#4B766B;">Presupuesto de tu reserva</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
      Hola <strong style="color:#1A1A1A;">${firstName}</strong>, aquí tienes el presupuesto para tu estancia en
      <strong style="color:#1A1A1A;">${aptTitle}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f9f7f4;width:38%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">Apartamento</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;"><strong>${aptTitle}</strong></td></tr>
      <tr><td style="padding:12px 16px;background:#f9f7f4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;">Llegada</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;border-top:1px solid #e8e0d0;">${fmt(r.check_in)}</td></tr>
      <tr><td style="padding:12px 16px;background:#f9f7f4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;">Salida</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;border-top:1px solid #e8e0d0;">${fmt(r.check_out)}</td></tr>
    </table>
    ${pricingHtml(r)}
    ${message ? `<div style="background:#F5F0E8;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#444;line-height:1.7;white-space:pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
    </div>` : ''}
    <div style="text-align:center;">
      <a href="${link}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
        Ver presupuesto y confirmar
      </a>
    </div>
  `)
}

/**
 * Envía (o reenvía) el presupuesto actual al huésped por email.
 * Congela el desglose vigente (total_price/cleaning_fee/extras ya guardados
 * por savePricing) y pasa la reserva a 'quote_sent'.
 */
export async function sendQuote(id: number, message: string) {
  const { data: reserva, error } = await db
    .from('reservas')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !reserva) throw new Error(error?.message ?? 'Reserva no encontrada')
  if (!reserva.total_price) throw new Error('Define primero el precio antes de enviar el presupuesto.')

  const token = reserva.quote_token || crypto.randomUUID()

  const { error: updError } = await db
    .from('reservas')
    .update({
      status: 'quote_sent',
      quote_message: message,
      quote_token: token,
      quote_sent_at: new Date().toISOString(),
      quote_accepted_at: null,
    })
    .eq('id', id)

  if (updError) throw new Error(updError.message)

  const apt = await db.from('apartments').select('title').eq('slug', reserva.apartment_slug).single()
  const aptTitle = APT_NAMES[reserva.apartment_slug] || apt.data?.title || reserva.apartment_slug
  const link = `${BASE_URL}/presupuesto/${token}`

  await resend.emails.send({
    from: FROM,
    to: reserva.guest_email,
    subject: `Presupuesto de tu reserva — ${aptTitle}`,
    html: quoteHtml(reserva, aptTitle, message, link),
  })

  revalidatePath(`/admin/reservas/${id}`)
  return { ok: true, token }
}

export async function getReservaByQuoteToken(token: string) {
  const { data: reserva } = await db
    .from('reservas')
    .select('id, guest_name, apartment_slug, check_in, check_out, status, total_price, cleaning_fee, extras, quote_message, quote_sent_at, quote_accepted_at')
    .eq('quote_token', token)
    .single()

  return reserva ?? null
}

/**
 * El huésped acepta el presupuesto desde la página pública.
 */
export async function acceptQuote(token: string) {
  const { data: reserva, error } = await db
    .from('reservas')
    .select('id, guest_name, apartment_slug, status')
    .eq('quote_token', token)
    .single()

  if (error || !reserva) throw new Error('Presupuesto no encontrado')
  if (reserva.status === 'quote_accepted' || reserva.status === 'confirmed') {
    return { ok: true, alreadyAccepted: true }
  }

  const { error: updError } = await db
    .from('reservas')
    .update({ status: 'quote_accepted', quote_accepted_at: new Date().toISOString() })
    .eq('id', reserva.id)

  if (updError) throw new Error(updError.message)

  if (MAR) {
    const aptTitle = APT_NAMES[reserva.apartment_slug] || reserva.apartment_slug
    await resend.emails.send({
      from: FROM,
      to: MAR,
      subject: `${reserva.guest_name} ha aceptado el presupuesto — ${aptTitle}`,
      html: shell(`
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#4B766B;">Presupuesto aceptado</h1>
        <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">
          <strong>${reserva.guest_name}</strong> ha aceptado el presupuesto de su reserva en <strong>${aptTitle}</strong>.
          Ya puedes registrar el depósito cuando lo recibas y aprobar la reserva desde el admin.
        </p>
      `),
    })
  }

  revalidatePath(`/admin/reservas/${reserva.id}`)
  return { ok: true, alreadyAccepted: false }
}
