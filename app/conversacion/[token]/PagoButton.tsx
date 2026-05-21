'use client'

import { useState, useTransition } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { crearSesionPago } from '@/app/actions/pagos'

type Props = { token: string; amount: number }

export default function PagoButton({ token, amount }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handlePagar() {
    setError(null)
    startTransition(async () => {
      try {
        const url = await crearSesionPago(token)
        window.location.href = url
      } catch {
        setError('Error al iniciar el pago. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <>
      <button
        onClick={handlePagar}
        disabled={isPending}
        style={{
          background: '#4B766B', color: '#fff', border: 'none',
          borderRadius: 10, padding: '12px 28px', fontSize: 14,
          fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {isPending ? (
          <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Redirigiendo…</>
        ) : (
          <><CreditCard size={16} /> Pagar {amount}€ de forma segura</>
        )}
      </button>
      {error && <p style={{ margin: '8px 0 0', fontSize: 12, color: '#e53e3e', textAlign: 'center' }}>{error}</p>}
    </>
  )
}
