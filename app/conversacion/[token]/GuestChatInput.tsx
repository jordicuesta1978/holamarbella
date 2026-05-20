'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'
import { enviarMensajeHuesped } from '@/app/actions/mensajes'

export default function GuestChatInput({ token }: { token: string }) {
  const router = useRouter()
  const [texto, setTexto] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || isPending) return
    const msg = texto.trim()
    setTexto('')
    setError(null)
    startTransition(async () => {
      try {
        await enviarMensajeHuesped(token, msg)
        router.refresh()
      } catch {
        setError('Error al enviar. Inténtalo de nuevo.')
        setTexto(msg)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 16px', background: '#fff' }}>
      {error && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#e53e3e' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje… (Enter para enviar)"
          rows={2}
          style={{
            flex: 1, border: '1.5px solid #e2e8f0', borderRadius: 10,
            padding: '8px 12px', fontSize: 14, resize: 'none',
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
  )
}
