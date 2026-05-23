'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const MAR = process.env.MAR_EMAIL!
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://holamarbella.vercel.app'

const db = supabaseAdmin as any

export type MensajeChat = {
  id: number
  reserva_id: number
  sender: 'guest' | 'admin'
  texto: string
  tipo: 'text' | 'payment_request'
  payment_amount: number | null
  leido: boolean
  created_at: string
}

export async function getMensajesReserva(reservaId: number): Promise<MensajeChat[]> {
  const { data } = await db
    .from('mensajes_chat')
    .select('*')
    .eq('reserva_id', reservaId)
    .order('created_at', { ascending: true })
  return (data ?? []) as MensajeChat[]
}

export async function getConversacionByToken(token: string) {
  const { data: reserva } = await db
    .from('reservas')
    .select('id, guest_name, guest_email, apartment_slug, check_in, check_out, status, conversation_token, total_price, paid_at')
    .eq('conversation_token', token)
    .single()

  if (!reserva) return null

  const mensajes = await getMensajesReserva(reserva.id)
  return { reserva, mensajes }
}

export async function enviarMensajeAdmin(reservaId: number, texto: string) {
  const { data: reserva } = await db
    .from('reservas')
    .select('guest_name, guest_email, conversation_token, apartment_slug')
    .eq('id', reservaId)
    .single()

  if (!reserva) throw new Error('Reserva no encontrada')

  await db.from('mensajes_chat').insert({
    reserva_id: reservaId,
    sender: 'admin',
    texto,
    tipo: 'text',
    leido: false,
  })

  const link = `${BASE_URL}/conversacion/${reserva.conversation_token}`
  const firstName = (reserva.guest_name as string).split(' ')[0]

  await resend.emails.send({
    from: FROM,
    to: reserva.guest_email,
    subject: 'Nuevo mensaje sobre tu reserva — HolaMarbella',
    html: emailToGuest(firstName, texto, link),
  }).catch(() => {})

  revalidatePath(`/admin/reservas/${reservaId}`)
  revalidatePath('/admin/inbox')
}

export async function enviarMensajeHuesped(token: string, texto: string) {
  const { data: reserva } = await db
    .from('reservas')
    .select('id, guest_name, guest_email, apartment_slug, conversation_token')
    .eq('conversation_token', token)
    .single()

  if (!reserva) throw new Error('Conversación no encontrada')

  await db.from('mensajes_chat').insert({
    reserva_id: reserva.id,
    sender: 'guest',
    texto,
    tipo: 'text',
    leido: false,
  })

  await resend.emails.send({
    from: FROM,
    to: MAR,
    subject: `Mensaje de ${reserva.guest_name} — Reserva #${reserva.id}`,
    html: emailToAdmin(reserva.guest_name, texto, reserva.id, reserva.apartment_slug),
  }).catch(() => {})

  revalidatePath(`/conversacion/${token}`)
  revalidatePath('/admin')
  revalidatePath('/admin/inbox')
  revalidatePath(`/admin/reservas/${reserva.id}`)
}

export async function solicitarPago(reservaId: number, amount: number) {
  const { data: reserva } = await db
    .from('reservas')
    .select('guest_name, guest_email, conversation_token, apartment_slug')
    .eq('id', reservaId)
    .single()

  if (!reserva) throw new Error('Reserva no encontrada')
  if (!reserva.conversation_token) throw new Error('La reserva no tiene token de conversación')

  const texto = `Hemos preparado el pago para tu reserva. Importe total: ${amount}€. Haz clic en el botón de abajo para completar el pago.`

  await db.from('mensajes_chat').insert({
    reserva_id: reservaId,
    sender: 'admin',
    texto,
    tipo: 'payment_request',
    payment_amount: amount,
    leido: false,
  })

  const pagarLink = `${BASE_URL}/api/pagar/${reserva.conversation_token}`
  const firstName = (reserva.guest_name as string).split(' ')[0]

  await resend.emails.send({
    from: FROM,
    to: reserva.guest_email,
    subject: 'Solicitud de pago — HolaMarbella',
    html: emailPagoGuest(firstName, amount, pagarLink),
  }).catch(() => {})

  revalidatePath(`/admin/reservas/${reservaId}`)
  revalidatePath('/admin/inbox')
  revalidatePath('/admin/pagos')
}

export async function marcarMensajesLeidos(reservaId: number, sender: 'guest' | 'admin') {
  await db
    .from('mensajes_chat')
    .update({ leido: true })
    .eq('reserva_id', reservaId)
    .eq('sender', sender)
    .eq('leido', false)
}

// ── Email templates ───────────────────────────────────────────────────────────

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

function emailToGuest(firstName: string, texto: string, link: string) {
  return shell(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#4B766B;">Tienes un nuevo mensaje</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
      Hola <strong style="color:#1A1A1A;">${firstName}</strong>, hemos enviado un mensaje sobre tu reserva.
    </p>
    <div style="background:#f9f7f4;border-left:4px solid #4B766B;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px;">
      <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.7;">${texto}</p>
    </div>
    <a href="${link}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ver conversación</a>
    <p style="margin:20px 0 0;font-size:12px;color:#aaa;">O copia este enlace: ${link}</p>
  `)
}

function emailPagoGuest(firstName: string, amount: number, pagarLink: string) {
  return shell(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#4B766B;">Solicitud de pago para tu reserva</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
      Hola <strong style="color:#1A1A1A;">${firstName}</strong>, hemos preparado el pago para tu reserva.
    </p>
    <div style="background:#f0f9f6;border:2px solid #4B766B;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0;font-size:40px;font-weight:800;color:#1A1A1A;">${amount}€</p>
    </div>
    <div style="text-align:center;">
      <a href="${pagarLink}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;">Pagar ahora</a>
    </div>
  `)
}

function emailToAdmin(guestName: string, texto: string, reservaId: number, aptSlug: string) {
  return shell(`
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#4B766B;">Mensaje de ${guestName}</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#999;">Reserva #${reservaId} · ${aptSlug}</p>
    <div style="background:#f9f7f4;border-left:4px solid #e2e8f0;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:28px;">
      <p style="margin:0;font-size:14px;color:#1A1A1A;line-height:1.7;">${texto}</p>
    </div>
    <a href="${BASE_URL}/admin/reservas/${reservaId}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ver en el panel</a>
  `)
}
