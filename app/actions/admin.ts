'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSession, deleteSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { computeNightlyBreakdown, renderPricingTable } from '@/lib/pricing'
import { EMAIL_LABELS, fmtEmailDate, type EmailLocale } from '@/lib/email-i18n'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

const APT_NAMES: Record<string, string> = {
  paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
}
function aptDisplay(slug: string, fallbackTitle: string): string {
  return APT_NAMES[slug] ? `Apartamento ${APT_NAMES[slug]}` : fallbackTitle
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getAdminPassword(): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabaseAdmin as any)
      .from('admin_config')
      .select('value')
      .eq('key', 'admin_password')
      .single()
    if (data?.value) return data.value
  } catch { /* fallback to env */ }
  return process.env.ADMIN_PASSWORD ?? ''
}

export async function login(prevState: string | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const storedPassword = await getAdminPassword()

  if (email !== process.env.ADMIN_EMAIL || password !== storedPassword) {
    return 'Credenciales incorrectas.'
  }

  await createSession()
  redirect('/admin')
}

export async function logout() {
  await deleteSession()
  redirect('/admin/login')
}

export async function changePassword(prevState: string | null, formData: FormData) {
  const current = formData.get('current') as string
  const next = formData.get('next') as string
  const confirm = formData.get('confirm') as string

  if (next !== confirm) return 'error:Las contraseñas nuevas no coinciden.'
  if (next.length < 6) return 'error:La nueva contraseña debe tener al menos 6 caracteres.'

  const storedPassword = await getAdminPassword()
  if (current !== storedPassword) return 'error:La contraseña actual es incorrecta.'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('admin_config')
    .upsert({ key: 'admin_password', value: next, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) return 'error:No se pudo guardar la contraseña. Inténtalo de nuevo.'
  return 'ok:Contraseña actualizada correctamente.'
}

// ── Reservas ──────────────────────────────────────────────────────────────────

export async function updateReservaStatus(
  id: number,
  status: 'confirmed' | 'cancelled',
  cancelMessage?: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reserva, error } = await (supabaseAdmin as any)
    .from('reservas')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error || !reserva) throw new Error((error as any)?.message ?? 'Not found')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apt = await (supabaseAdmin as any).from('apartments').select('title, price_min, price_max').eq('slug', (reserva as any).apartment_slug).single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = reserva as any
  const aptTitle = aptDisplay(r.apartment_slug, apt.data?.title ?? r.apartment_slug)
  const aptPrices = { price_min: apt.data?.price_min ?? 80, price_max: apt.data?.price_max ?? 160 }
  const locale: EmailLocale = r.locale === 'en' ? 'en' : 'es'

  if (status === 'confirmed') {
    await resend.emails.send({
      from: FROM,
      to: r.guest_email,
      subject: locale === 'en' ? `Booking confirmed! — ${aptTitle}` : `¡Reserva confirmada! — ${aptTitle}`,
      html: await confirmedHtml(r, aptTitle, aptPrices, locale),
    })
  } else {
    await resend.emails.send({
      from: FROM,
      to: r.guest_email,
      subject: locale === 'en' ? `Update on your request — ${aptTitle}` : `Actualización sobre tu solicitud — ${aptTitle}`,
      html: cancelledHtml(r, aptTitle, cancelMessage, locale),
    })
  }

  revalidatePath('/admin')
  revalidatePath('/admin/reservas')
  revalidatePath(`/admin/reservas/${id}`)

  return { ok: true }
}

export async function reopenReserva(id: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('reservas')
    .update({ status: 'pending' })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/reservas')
  revalidatePath(`/admin/reservas/${id}`)

  return { ok: true }
}

export type Extra = { name: string; amount: number; quantity?: number; unit?: string }

export async function savePricing(
  id: number,
  cleaningFee: number,
  extras: Extra[],
  baseAmount: number,
  depositPaid: number = 0
) {
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount * (e.quantity ?? 1), 0)
  const total = baseAmount + cleaningFee + extrasTotal

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any)
    .from('reservas')
    .update({ cleaning_fee: cleaningFee, extras, total_price: total, deposit_paid: depositPaid })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/reservas')
  revalidatePath(`/admin/reservas/${id}`)

  return { ok: true, total }
}

// ── Email templates ───────────────────────────────────────────────────────────

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pricingHtml(r: any, apt: { price_min: number; price_max: number }, locale: EmailLocale): Promise<string> {
  if (!r.total_price) return ''
  const nights =
    r.check_in && r.check_out
      ? Math.round((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)
      : 0
  const extras: Extra[] = r.extras ?? []
  const cleaningFee: number = r.cleaning_fee ?? 0
  const extrasTotal = extras.reduce((s: number, e: Extra) => s + e.amount * (e.quantity ?? 1), 0)
  const base = r.total_price - cleaningFee - extrasTotal
  const midPrice = Math.round((apt.price_min + apt.price_max) / 2)
  const breakdown = await computeNightlyBreakdown(r.apartment_slug, r.check_in, r.check_out, midPrice)

  const tableHtml = renderPricingTable({ breakdown, base, nights, cleaningFee, extras, total: r.total_price, locale })

  const depositPaid: number = r.deposit_paid ?? 0
  if (depositPaid <= 0) return tableHtml

  const t = EMAIL_LABELS[locale]
  const paid = Math.min(depositPaid, r.total_price)
  const pending = Math.max(r.total_price - depositPaid, 0)
  const tdL = `style="padding:8px 16px;background:#f9f7f4;font-size:12px;color:#888;border-top:1px solid #e8e0d0;"`
  const tdR = `style="padding:8px 16px;font-size:13px;color:#1A1A1A;border-top:1px solid #e8e0d0;text-align:right;"`
  const depositRows = `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin:0 0 24px;">
    <tr><td ${tdL}>${t.depositPaid}</td><td ${tdR}>${paid}€</td></tr>
    <tr><td style="padding:8px 16px;background:#f9f7f4;font-size:12px;font-weight:700;color:${pending > 0 ? '#d97706' : '#4B766B'};border-top:1px solid #e8e0d0;">${t.balanceDue}</td><td style="padding:8px 16px;font-size:13px;font-weight:700;color:${pending > 0 ? '#d97706' : '#4B766B'};border-top:1px solid #e8e0d0;text-align:right;">${pending}€</td></tr>
  </table>`

  return tableHtml + depositRows
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function confirmedHtml(r: any, aptTitle: string, apt: { price_min: number; price_max: number }, locale: EmailLocale) {
  const t = EMAIL_LABELS[locale]
  const firstName = (r.guest_name as string).split(' ')[0]
  const title = locale === 'en' ? 'Booking confirmed!' : '¡Reserva confirmada!'
  const greeting = locale === 'en'
    ? `Hi <strong style="color:#1A1A1A;">${firstName}</strong>, we've confirmed your booking at
       <strong style="color:#1A1A1A;">${aptTitle}</strong>. See you soon!`
    : `Hola <strong style="color:#1A1A1A;">${firstName}</strong>, hemos confirmado tu reserva en
       <strong style="color:#1A1A1A;">${aptTitle}</strong>. ¡Nos vemos pronto!`
  const closing = locale === 'en'
    ? "We'll be in touch to coordinate your arrival and send you all the details."
    : 'Nos pondremos en contacto contigo para coordinar tu llegada y enviarte todos los detalles.'
  return shell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#4B766B;">${title}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
      ${greeting}
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f9f7f4;width:38%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;">${t.apartment}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;"><strong>${aptTitle}</strong></td></tr>
      <tr><td style="padding:12px 16px;background:#f9f7f4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;">${t.checkIn}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;border-top:1px solid #e8e0d0;">${fmt(r.check_in, locale)}</td></tr>
      <tr><td style="padding:12px 16px;background:#f9f7f4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;">${t.checkOut}</td>
          <td style="padding:12px 16px;font-size:14px;color:#1A1A1A;border-top:1px solid #e8e0d0;">${fmt(r.check_out, locale)}</td></tr>
    </table>
    ${await pricingHtml(r, apt, locale)}
    <div style="background:#F5F0E8;border-radius:10px;padding:20px 24px;">
      <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">
        ${closing}
      </p>
    </div>
  `, locale)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cancelledHtml(r: any, aptTitle: string, customMessage: string | undefined, locale: EmailLocale) {
  const firstName = (r.guest_name as string).split(' ')[0]
  const defaultBody = locale === 'en'
    ? `Unfortunately we can't confirm your request for <strong>${aptTitle}</strong> on the requested dates.<br><br>If you have alternative dates or would like to check availability, feel free to contact us. Thank you for your interest in HolaMarBella!`
    : `Lamentablemente no podemos confirmar tu solicitud para <strong>${aptTitle}</strong> en las fechas indicadas.<br><br>Si tienes fechas alternativas o quieres consultar disponibilidad, no dudes en contactarnos. Gracias por tu interés en HolaMarBella!`
  const body = customMessage ? customMessage.replace(/\n/g, '<br>') : defaultBody
  const title = locale === 'en' ? 'About your request' : 'Sobre tu solicitud'
  const greeting = locale === 'en' ? `Hi <strong style="color:#1A1A1A;">${firstName}</strong>,` : `Hola <strong style="color:#1A1A1A;">${firstName}</strong>,`
  return shell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#4B766B;">${title}</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
      ${greeting}
    </p>
    <div style="background:#F5F0E8;border-radius:10px;padding:20px 24px;">
      <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">${body}</p>
    </div>
  `, locale)
}
