import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://holamarbella.vercel.app'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const { data: reserva } = await db
      .from('reservas')
      .select('id, guest_name, guest_email, apartment_slug, total_price, conversation_token')
      .eq('conversation_token', token)
      .single()

    if (!reserva || !reserva.total_price) {
      return NextResponse.redirect(`${BASE_URL}/conversacion/${token}`)
    }

    const APT_NAMES: Record<string, string> = {
      paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
    }
    const aptName = APT_NAMES[reserva.apartment_slug]
      ? `Apartamento ${APT_NAMES[reserva.apartment_slug]}`
      : reserva.apartment_slug

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: reserva.guest_email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: aptName,
              description: `Reserva para ${reserva.guest_name}`,
            },
            unit_amount: Math.round(reserva.total_price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${BASE_URL}/conversacion/${token}?pago=ok`,
      cancel_url: `${BASE_URL}/conversacion/${token}`,
      metadata: { reserva_id: String(reserva.id), token },
    })

    await db.from('reservas').update({ stripe_session_id: session.id }).eq('id', reserva.id)

    return NextResponse.redirect(session.url!)
  } catch {
    return NextResponse.redirect(`${BASE_URL}/conversacion/${token}`)
  }
}
