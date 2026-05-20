'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateReservaStatus } from '@/app/actions/admin'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function ReservaActions({ id }: { id: number }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState<'confirmed' | 'cancelled' | null>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = (status: 'confirmed' | 'cancelled') => {
    setAction(status)
    setError(null)
    startTransition(async () => {
      try {
        await updateReservaStatus(id, status)
        setDone(true)
        router.refresh()
      } catch {
        setError('Error al actualizar la reserva. Inténtalo de nuevo.')
        setAction(null)
      }
    })
  }

  if (done) {
    return (
      <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 12, padding: '20px 24px', textAlign: 'center', fontSize: 14, color: '#065f46', fontWeight: 600 }}>
        ✓ Estado actualizado. Email enviado al huésped.
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Acción</p>
      {error && (
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => handle('confirmed')}
          disabled={isPending}
          style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
        >
          {isPending && action === 'confirmed'
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : <CheckCircle2 size={16} />}
          Aprobar reserva
        </button>
        <button
          onClick={() => handle('cancelled')}
          disabled={isPending}
          style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
        >
          {isPending && action === 'cancelled'
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : <XCircle size={16} />}
          Rechazar
        </button>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12, color: '#aaa' }}>Se enviará un email automático al huésped con el resultado.</p>
    </div>
  )
}
