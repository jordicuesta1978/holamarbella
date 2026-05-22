'use server'

/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://holamarbella.vercel.app'
const db = supabaseAdmin as any

export async function crearSesionPago(token: string): Promise<string> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { data: reserva } = await db
    .from('reservas')
    .select('id, guest_name, guest_email, apartment_slug, total_price, conversation_token')
    .eq('conversation_token', token)
    .single()

  if (!reserva || !reserva.total_price) throw new Error('Reserva no encontrada o sin precio')

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: reserva.guest_email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Reserva ${reserva.apartment_slug}`,
            description: `Reserva para ${reserva.guest_name}`,
          },
          unit_amount: Math.round(reserva.total_price * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${BASE_URL}/conversacion/${token}?pago=ok`,
    cancel_url: `${BASE_URL}/conversacion/${token}`,
    metadata: {
      reserva_id: String(reserva.id),
      token,
    },
  })

  await db.from('reservas').update({ stripe_session_id: session.id }).eq('id', reserva.id)

  return session.url!
}
