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

const APT_NAMES: Record<string, string> = {
  paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
}

function aptDisplay(slug: string): string {
  return APT_NAMES[slug] ? `Apartamento ${APT_NAMES[slug]}` : slug
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

export async function crearReserva(
  input: ReservaInput
): Promise<{ ok: true; token: string; bookingRef: string } | { ok: false; error: string }> {
  const conversationToken = crypto.randomUUID()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('reservas').insert({
    apartment_slug: input.apartmentSlug,
    guest_name: input.nombre,
    guest_email: input.email,
    guest_phone: input.telefono || null,
    check_in: input.checkIn,
    check_out: input.checkOut,
    guests: input.personas,
    status: 'pending' as const,
    notes: input.mensaje,
    conversation_token: conversationToken,
  } as any)

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
  const displayTitle = aptDisplay(input.apartmentSlug)

  const emailTasks: Promise<unknown>[] = [
    resend.emails.send({
      from: FROM,
      to: input.email,
      subject: '¡Solicitud recibida!',
      html: emailHuesped(inputWithToken, displayTitle),
    }),
  ]

  if (MAR) {
    emailTasks.push(
      resend.emails.send({
        from: FROM,
        to: MAR,
        subject: `🔔 Nueva solicitud — ${input.nombre} · ${displayTitle}`,
        html: emailMar(input, bookingRef, displayTitle),
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

function emailHuesped(d: ReservaInputWithToken, displayTitle: string): string {
  const firstName = d.nombre.split(' ')[0]
  const conversationLink = `${BASE_URL}/conversacion/${d.conversationToken}`
  return shell(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#4B766B;">¡Solicitud recibida!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.7;">
      Hola <strong style="color:#1A1A1A;">${firstName}</strong>, hemos recibido tu solicitud para
      <strong style="color:#1A1A1A;">${displayTitle}</strong>.
      Revisaremos tu petición y nos pondremos en contacto contigo lo antes posible.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;margin-bottom:28px;">
      ${row('Apartamento', `<strong>${displayTitle}</strong>`, false)}
      ${d.bookingRef ? row('Referencia', `<strong style="font-family:monospace;letter-spacing:1px;">${d.bookingRef}</strong>`) : ''}
      ${row('Llegada', fmt(d.checkIn))}
      ${row('Salida', `${fmt(d.checkOut)}${nightsLabel(d.checkIn, d.checkOut)}`)}
      ${row('Personas', `${d.personas} persona${d.personas > 1 ? 's' : ''}`)}
      ${row('Tu mensaje', d.mensaje.replace(/\n/g, '<br>'))}
    </table>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${conversationLink}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:14px;">Ver mi reserva</a>
      <p style="margin:10px 0 0;font-size:11px;color:#bbb;">Guarda este enlace — es tu acceso privado a esta reserva</p>
    </div>

    <p style="margin:0;font-size:13px;color:#999;line-height:1.6;">
      ¿Tienes dudas? Responde directamente a este email.
    </p>
  `)
}

function emailMar(d: ReservaInput, bookingRef: string, displayTitle: string): string {
  const fecha = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
      ${row('Personas', `${d.personas}`)}
    </table>

    <div style="background:#F5F0E8;border-radius:10px;padding:20px 24px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#888;">Mensaje del huésped</p>
      <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.7;white-space:pre-wrap;">${d.mensaje}</p>
    </div>
  `)
}
