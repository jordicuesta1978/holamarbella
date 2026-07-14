'use client'

import { useState, useTransition } from 'react'
import { acceptQuote } from '@/app/actions/presupuesto'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function AceptarButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = () => {
    setError(null)
    startTransition(async () => {
      try {
        await acceptQuote(token)
        setDone(true)
      } catch {
        setError('No se ha podido registrar la aceptación. Inténtalo de nuevo o contacta con nosotros.')
      }
    })
  }

  if (done) {
    return (
      <div style={{
        background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 12,
        padding: '20px 24px', textAlign: 'center', fontSize: 14, color: '#065f46', fontWeight: 600,
      }}>
        ✓ Presupuesto aceptado. En breve recibirás instrucciones para el pago del depósito.
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {error && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>{error}</p>
      )}
      <button
        onClick={handleAccept}
        disabled={isPending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center',
          background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10,
          padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          opacity: isPending ? 0.6 : 1, minWidth: 220,
        }}
      >
        {isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
        Aceptar presupuesto
      </button>
    </div>
  )
}
