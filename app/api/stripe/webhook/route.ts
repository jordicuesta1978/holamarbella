import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://holamarbella.vercel.app'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const reservaId = Number(session.metadata?.reserva_id)

    if (reservaId) {
      await db
        .from('reservas')
        .update({ paid_at: new Date().toISOString(), stripe_session_id: session.id })
        .eq('id', reservaId)

      const { data: reserva } = await db
        .from('reservas')
        .select('guest_name, guest_email, apartment_slug, check_in, check_out, total_price, conversation_token')
        .eq('id', reservaId)
        .single()

      if (reserva) {
        const firstName = (reserva.guest_name as string).split(' ')[0]
        const link = `${BASE_URL}/conversacion/${reserva.conversation_token}`

        await resend.emails.send({
          from: FROM,
          to: reserva.guest_email,
          subject: '¡Pago recibido! Tu reserva está confirmada — HolaMarbella',
          html: emailPagoConfirmado(firstName, reserva.total_price, reserva.apartment_slug, link),
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ received: true })
}

function emailPagoConfirmado(firstName: string, amount: number, aptSlug: string, link: string) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#4B766B;padding:28px 40px;text-align:center;">
  <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">HolaMarBella!</p>
</td></tr>
<tr><td style="padding:40px 40px 32px;">
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#4B766B;">¡Pago recibido!</h1>
  <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.7;">
    Hola <strong style="color:#1A1A1A;">${firstName}</strong>, hemos recibido tu pago correctamente. Tu reserva en <strong>${aptSlug}</strong> está completamente confirmada.
  </p>
  <div style="background:#f0f9f6;border:2px solid #4B766B;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#4B766B;">Importe pagado</p>
    <p style="margin:0;font-size:36px;font-weight:800;color:#1A1A1A;">${amount}€</p>
  </div>
  <a href="${link}" style="display:inline-block;background:#4B766B;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Ver mi reserva</a>
  <p style="margin:20px 0 0;font-size:12px;color:#aaa;">O copia este enlace: ${link}</p>
</td></tr>
<tr><td style="background:#F5F0E8;padding:24px 40px;text-align:center;border-top:1px solid #e8e0d0;">
  <p style="margin:0;font-size:12px;color:#999;">HolaMarBella! · Marbella, España · © ${new Date().getFullYear()}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}
