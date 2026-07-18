'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import type { Extra } from './admin'
import { computeNightlyBreakdown, renderPricingTable } from '@/lib/pricing'
import { EMAIL_LABELS, fmtEmailDate, type EmailLocale } from '@/lib/email-i18n'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

const db = supabaseAdmin as any

const APT_NAMES: Record<string, string> = {
  paloma: 'Apartamento Paloma', micu: 'Apartamento Micu', larysol: 'Apartamento Larysol',
  ami: 'Ático AMI', banesto: 'Ático Banesto',
}

function fmt(d: string | null, locale: EmailLocale = 'es'): string {
  return fmtEmailDate(d, locale)
}

function shell(content: string, locale: EmailLocale = 'es') {
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#4B766B;padding:28px 40px;text-align:center;">
  <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">HolaMarBella!</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">${content}</td></tr>
<tr><td style="background:#F5F0E8;padding:24px 40px;text-align:center;border-top:1px solid #e8e0d0;">
  <p style="margin:0;font-size:12px;color:#999;">HolaMarBella! · Marbella, ${locale === 'en' ? 'Spain' : 'España'} · © ${new Date().getFullYear()}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

async function pricingHtml(r: any, apt: { price_min: number; price_max: number }, locale: EmailLocale): Promise<string> {
  const nights =
    r.check_in && r.check_out
      ? Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)
      : 0
  const extras: Extra[] = r.extras ?? []
  const cleaningFee: number = r.cleaning_fee ?? 0
  const extrasTotal = extras.reduce((s: number, e: Extra) => s + e.amount * (e.quantity ?? 1), 0)
  const total = r.total_price ?? 0
  const base = total - cleaningFee - extrasTotal
  const midPrice = Math.round((apt.price_min + apt.price_max) / 2)
  const breakdown = await computeNightlyBreakdown(r.apartment_slug, r.check_in, r.check_out, midPrice)

  return renderPricingTable({ breakdown, base, nights, cleaningFee, extras, total, locale })
}

function paymentMethodsHtml(locale: EmailLocale): string {
  const t = EMAIL_LABELS[locale]
  return `
    <div style="background:#F5F0E8;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#4B766B;">${t.paymentMethods}</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">${t.bankTransfer}: ES03 0081 7460 6000 0209 2117</p>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">Revolut: @mar14pu1</p>
    </div>`
}

async function quoteHtml(r: any, aptTitle: string, apt: { price_min: number; price_max: number }, message: string, locale: EmailLocale) {
  const t = EMAIL_LABELS[locale]
  const firstName = (r.guest_name as string).split(' ')[0]
  const introHtml = message
    ? `<p style="margin:0 0 24px;font-size:15px;color:#1A1A1A;line-height:1.7;white-space:pre-wrap;">${message.replace(/\n/g, '<br>')}</p>`
    : locale === 'en'
      ? `<p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
          Hi <strong style="color:#1A1A1A;">${firstName}</strong>, here's the quote for your stay at
          <strong style="color:#1A1A1A;">${aptTitle}</strong>.
        </p>`
      : `<p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
          Hola <strong style="color:#1A1A1A;">${firstName}</strong>, aquí tienes el presupuesto para tu estancia en
          <strong style="color:#1A1A1A;">${aptTitle}</strong>.
        </p>`
  const title = locale === 'en' ? 'Your booking quote' : 'Presupuesto de tu reserva'
  return shell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#4B766B;">${title}</h1>
    ${introHtml}
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f9f7f4;width:38%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">${t.apartment}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;"><strong>${aptTitle}</strong></td></tr>
      <tr><td style="padding:12px 16px;background:#f9f7f4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;">${t.checkIn}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;border-top:1px solid #e8e0d0;">${fmt(r.check_in, locale)}</td></tr>
      <tr><td style="padding:12px 16px;background:#f9f7f4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;">${t.checkOut}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;border-top:1px solid #e8e0d0;">${fmt(r.check_out, locale)}</td></tr>
    </table>
    ${await pricingHtml(r, apt, locale)}
    ${paymentMethodsHtml(locale)}
  `, locale)
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

  const { error: updError } = await db
    .from('reservas')
    .update({
      status: 'quote_sent',
      quote_message: message,
      quote_sent_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updError) throw new Error(updError.message)

  const apt = await db.from('apartments').select('title, price_min, price_max').eq('slug', reserva.apartment_slug).single()
  const aptTitle = APT_NAMES[reserva.apartment_slug] || apt.data?.title || reserva.apartment_slug
  const aptPrices = { price_min: apt.data?.price_min ?? 80, price_max: apt.data?.price_max ?? 160 }
  const locale: EmailLocale = reserva.locale === 'en' ? 'en' : 'es'
  const subject = locale === 'en' ? `Your booking quote — ${aptTitle}` : `Presupuesto de tu reserva — ${aptTitle}`

  await resend.emails.send({
    from: FROM,
    to: reserva.guest_email,
    subject,
    html: await quoteHtml(reserva, aptTitle, aptPrices, message, locale),
  })

  revalidatePath(`/admin/reservas/${id}`)
  return { ok: true }
}
