'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, CreditCard, Loader2 } from 'lucide-react'
import { enviarMensajeAdmin, solicitarPago, type MensajeChat } from '@/app/actions/mensajes'

type Props = {
  reservaId: number
  initialMensajes: MensajeChat[]
  totalPrice: number | null
  guestName: string
}

function fmtHora(d: string) {
  return new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
function fmtFecha(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ChatPanel({ reservaId, initialMensajes, totalPrice, guestName }: Props) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState<string>(totalPrice ? String(totalPrice) : '')
  const [paymentComment, setPaymentComment] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [initialMensajes.length])

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 15000)
    return () => clearInterval(interval)
  }, [router])

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || isPending) return
    const msg = texto.trim()
    setTexto('')
    setError(null)
    startTransition(async () => {
      try {
        await enviarMensajeAdmin(reservaId, msg)
        router.refresh()
      } catch {
        setError('Error al enviar. Inténtalo de nuevo.')
      }
    })
  }

  function handleSolicitarPago() {
    const amount = Number(customAmount)
    if (!amount || amount <= 0 || isPending) return
    setError(null)
    startTransition(async () => {
      try {
        await solicitarPago(reservaId, amount, paymentComment.trim() || undefined)
        setPaymentComment('')
        router.refresh()
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al solicitar pago.'
        setError(msg)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as React.FormEvent)
    }
  }

  let lastDate = ''

  return (
    <section id="chat" style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#555' }}>
          Chat con {guestName.split(' ')[0]}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ background: '#f0f9f6', border: '1.5px solid #4B766B', borderRadius: 8, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCard size={13} color="#4B766B" />
              <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>Importe:</span>
              <input
                type="number"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                min={1}
                placeholder="€"
                style={{ width: 64, border: '1px solid #b2d4cc', borderRadius: 6, padding: '3px 6px', fontSize: 13, fontWeight: 700, color: '#1a1a2e', outline: 'none', background: '#fff' }}
              />
              <button
                onClick={handleSolicitarPago}
                disabled={!customAmount || Number(customAmount) <= 0 || isPending}
                style={{
                  background: '#4B766B', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  opacity: (!customAmount || Number(customAmount) <= 0 || isPending) ? 0.5 : 1,
                }}
              >
                Solicitar pago
              </button>
            </div>
            <textarea
              value={paymentComment}
              onChange={e => setPaymentComment(e.target.value)}
              placeholder="Comentario para el huésped (opcional)"
              rows={2}
              style={{ width: '100%', border: '1px solid #b2d4cc', borderRadius: 6, padding: '5px 8px', fontSize: 12, resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#1a1a2e', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: 340, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4, background: '#fafafa' }}>
        {initialMensajes.length === 0 && (
          <p style={{ textAlign: 'center', color: '#bbb', fontSize: 13, margin: 'auto' }}>
            Aún no hay mensajes. Empieza la conversación.
          </p>
        )}
        {initialMensajes.map((m) => {
          const dateStr = fmtFecha(m.created_at)
          const showDate = dateStr !== lastDate
          lastDate = dateStr
          const isAdmin = m.sender === 'admin'

          return (
            <div key={m.id}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '8px 0 4px' }}>
                  <span style={{ fontSize: 11, color: '#aaa', background: '#ececec', borderRadius: 20, padding: '2px 10px' }}>{dateStr}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isAdmin ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                {m.tipo === 'payment_request' ? (
                  <div style={{
                    background: '#f0f9f6', border: '1.5px solid #4B766B',
                    borderRadius: 12, padding: '12px 16px', maxWidth: '72%',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <CreditCard size={14} color="#4B766B" />
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4B766B' }}>Solicitud de pago</span>
                    </div>
                    {m.payment_amount && (
                      <p style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>{m.payment_amount}€</p>
                    )}
                    <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{fmtHora(m.created_at)}</p>
                  </div>
                ) : (
                  <div style={{
                    background: isAdmin ? '#4B766B' : '#fff',
                    color: isAdmin ? '#fff' : '#1a1a2e',
                    borderRadius: isAdmin ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '8px 14px',
                    maxWidth: '72%',
                    border: isAdmin ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}>
                    <p style={{ margin: '0 0 4px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.texto}</p>
                    <p style={{ margin: 0, fontSize: 10, opacity: 0.6, textAlign: 'right' }}>{fmtHora(m.created_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 16px', background: '#fff' }}>
        {error && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#e53e3e' }}>{error}</p>}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje… (Enter para enviar)"
            rows={2}
            style={{
              flex: 1, border: '1px solid #e2e8f0', borderRadius: 10, background: '#fff',
              padding: '8px 12px', fontSize: 13, resize: 'none',
              outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
              color: '#1a1a2e',
            }}
          />
          <button
            type="submit"
            disabled={!texto.trim() || isPending}
            style={{
              background: '#4B766B', color: '#fff', border: 'none',
              borderRadius: 10, padding: '10px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (!texto.trim() || isPending) ? 0.4 : 1,
              flexShrink: 0,
            }}
          >
            {isPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </section>
  )
}
