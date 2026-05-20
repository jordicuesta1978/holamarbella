'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2, CheckCircle2 } from 'lucide-react'
import { solicitarPago } from '@/app/actions/mensajes'

export default function SolicitarPagoBtn({ reservaId, amount }: { reservaId: number; amount: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handle = () => {
    startTransition(async () => {
      await solicitarPago(reservaId, amount)
      setDone(true)
      router.refresh()
    })
  }

  if (done) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4B766B', fontWeight: 700 }}>
        <CheckCircle2 size={13} /> Enviado
      </span>
    )
  }

  return (
    <button
      onClick={handle}
      disabled={isPending}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: '#4B766B', color: '#fff', border: 'none',
        borderRadius: 8, padding: '7px 14px', fontSize: 12,
        fontWeight: 700, cursor: 'pointer',
        opacity: isPending ? 0.5 : 1, whiteSpace: 'nowrap',
      }}
    >
      {isPending ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={12} />}
      Solicitar pago
    </button>
  )
}
