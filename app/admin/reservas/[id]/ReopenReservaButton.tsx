'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { reopenReserva } from '@/app/actions/admin'
import { RotateCcw, Loader2 } from 'lucide-react'

export default function ReopenReservaButton({ id, status }: { id: number; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleReopen = () => {
    setError(null)
    startTransition(async () => {
      try {
        await reopenReserva(id)
        router.refresh()
      } catch {
        setError('Error al reabrir la reserva. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#aaa' }}>
        Esta reserva ya fue {status === 'cancelled' ? 'rechazada' : 'procesada'}.
      </p>
      {error && <p style={{ margin: '0 0 12px', fontSize: 13, color: '#e53e3e' }}>{error}</p>}
      <button
        onClick={handleReopen}
        disabled={isPending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#fff', color: '#4B766B', border: '1.5px solid #4B766B',
          borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', opacity: isPending ? 0.6 : 1,
        }}
      >
        {isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={14} />}
        Reabrir reserva
      </button>
      <p style={{ margin: '10px 0 0', fontSize: 11, color: '#bbb' }}>
        Vuelve a estado &quot;Pendiente&quot; para poder editarla, cambiar el precio o aprobarla/rechazarla de nuevo.
      </p>
    </div>
  )
}
