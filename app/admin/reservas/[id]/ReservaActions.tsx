'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateReservaStatus } from '@/app/actions/admin'
import { CheckCircle2, XCircle, Loader2, X, AlertTriangle } from 'lucide-react'

export default function ReservaActions({
  id,
  status,
  depositPaid = 0,
}: {
  id: number
  status?: string
  depositPaid?: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [cancelMsg, setCancelMsg] = useState('')

  const handleConfirm = () => {
    setError(null)
    startTransition(async () => {
      try {
        await updateReservaStatus(id, 'confirmed')
        setDone(true)
        router.refresh()
      } catch {
        setError('Error al actualizar la reserva. Inténtalo de nuevo.')
      }
    })
  }

  const handleCancelSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        await updateReservaStatus(id, 'cancelled', cancelMsg.trim() || undefined)
        setDone(true)
        setShowModal(false)
        router.refresh()
      } catch {
        setError('Error al actualizar la reserva. Inténtalo de nuevo.')
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
    <>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px' }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Acción</p>
        {(status !== 'quote_accepted' || depositPaid <= 0) && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              {status !== 'quote_accepted'
                ? 'El cliente todavía no ha aceptado el presupuesto. '
                : ''}
              {depositPaid <= 0 ? 'No hay ningún depósito registrado todavía. ' : ''}
              Lo habitual es aprobar la reserva solo cuando el cliente haya pagado el anticipo.
            </span>
          </div>
        )}
        {error && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
            Aprobar reserva
          </button>
          <button
            onClick={() => setShowModal(true)}
            disabled={isPending}
            style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}
          >
            <XCircle size={16} />
            Rechazar
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#aaa' }}>Se enviará un email al huésped con el mensaje que escribas.</p>
      </div>

      {/* Modal de cancelación */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Mensaje al huésped</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>
              Escribe el mensaje que recibirá el huésped. Si lo dejas en blanco se enviará el texto por defecto.
            </p>
            <textarea
              value={cancelMsg}
              onChange={e => setCancelMsg(e.target.value)}
              placeholder="Ej: Lamentablemente las fechas que solicitas ya están ocupadas. Si quieres, podemos buscar otras fechas disponibles…"
              rows={5}
              style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#1a1a2e', resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, background: '#f4f5f7', color: '#555', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={isPending}
                style={{ flex: 1, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                Rechazar y enviar email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
