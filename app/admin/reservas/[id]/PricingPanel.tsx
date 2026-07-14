'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { savePricing, type Extra } from '@/app/actions/admin'
import { sendQuote } from '@/app/actions/presupuesto'
import { Plus, X, Loader2, Send } from 'lucide-react'

type PriceRange = { start: string; end: string; price: number }

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Same logic as CalendarPicker / ReservarContent — not modified
function calcNightlyPrices(
  checkIn: string,
  checkOut: string,
  priceRanges: PriceRange[],
  midPrice: number,
): Array<{ date: string; price: number }> {
  const nights: Array<{ date: string; price: number }> = []
  const s = new Date(checkIn + 'T00:00:00')
  const e = new Date(checkOut + 'T00:00:00')
  for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const key = toKey(d)
    let range: PriceRange | undefined
    for (const p of priceRanges) {
      if (key >= p.start && key < p.end) range = p
    }
    nights.push({ date: key, price: range?.price ?? midPrice })
  }
  return nights
}

function groupBreakdown(nights: Array<{ date: string; price: number }>): Array<{ price: number; count: number }> {
  const groups: Array<{ price: number; count: number }> = []
  for (const n of nights) {
    const last = groups[groups.length - 1]
    if (last && last.price === n.price) last.count++
    else groups.push({ price: n.price, count: 1 })
  }
  return groups
}

type Props = {
  id: number
  nights: number
  priceMin: number
  priceMax: number
  initialCleaningFee: number
  initialExtras: Extra[]
  initialTotal: number | null
  initialDepositPaid?: number
  priceRanges?: PriceRange[]
  checkIn?: string
  checkOut?: string
  initialQuoteMessage?: string
  quoteStatus?: string
  quoteSentAt?: string | null
  quoteAcceptedAt?: string | null
}

export default function PricingPanel({
  id,
  nights,
  priceMin,
  priceMax,
  initialCleaningFee,
  initialExtras,
  initialTotal,
  initialDepositPaid = 0,
  priceRanges = [],
  checkIn,
  checkOut,
  initialQuoteMessage = '',
  quoteStatus,
  quoteSentAt,
  quoteAcceptedAt,
}: Props) {
  const router = useRouter()
  const midPrice = Math.round((priceMin + priceMax) / 2)

  // Compute per-range breakdown (same logic as CalendarPicker)
  const rangeNights = (priceRanges.length > 0 && checkIn && checkOut)
    ? calcNightlyPrices(checkIn, checkOut, priceRanges, midPrice)
    : []
  const rangeBreakdown = groupBreakdown(rangeNights)
  const rangeBase = rangeNights.reduce((s, n) => s + n.price, 0)
  // Use range base if available; fall back to initialTotal back-calculation or midPrice
  const defaultRate = rangeBase > 0
    ? Math.round(rangeBase / Math.max(nights, 1))
    : (initialTotal && nights > 0
      ? Math.round((initialTotal - initialCleaningFee - initialExtras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)) / nights)
      : midPrice)

  const [rate, setRate] = useState(defaultRate)
  const [cleaningFee, setCleaningFee] = useState(initialCleaningFee)
  const [extras, setExtras] = useState<Extra[]>(initialExtras)
  const [depositPaid, setDepositPaid] = useState(initialDepositPaid)
  const [quoteMessage, setQuoteMessage] = useState(initialQuoteMessage)

  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newUnit, setNewUnit] = useState('')

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [isSending, startSendTransition] = useTransition()
  const [quoteSent, setQuoteSent] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  // base: use range breakdown total when available; otherwise manual rate × nights
  const base = rangeBase > 0 ? rangeBase : rate * nights
  const extrasTotal = extras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)
  const total = base + cleaningFee + extrasTotal
  const pending = Math.max(total - depositPaid, 0)

  const addCustom = () => {
    if (!newName.trim() || !newAmount) return
    setExtras(prev => [...prev, {
      name: newName.trim(),
      amount: Number(newAmount),
      quantity: Number(newQty) || 1,
      unit: newUnit.trim() || undefined,
    }])
    setNewName(''); setNewAmount(''); setNewQty('1'); setNewUnit('')
  }

  const removeExtra = (i: number) => setExtras(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = () => {
    setSaved(false); setError(null)
    startTransition(async () => {
      try {
        await savePricing(id, cleaningFee, extras, base, depositPaid)
        setSaved(true)
        router.refresh()
      } catch {
        setError('Error al guardar. Inténtalo de nuevo.')
      }
    })
  }

  const handleSendQuote = () => {
    setQuoteSent(false); setQuoteError(null)
    startSendTransition(async () => {
      try {
        await savePricing(id, cleaningFee, extras, base, depositPaid)
        await sendQuote(id, quoteMessage)
        setQuoteSent(true)
        router.refresh()
      } catch {
        setQuoteError('Error al enviar el presupuesto. Inténtalo de nuevo.')
      }
    })
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1.5px solid #d1d5db', borderRadius: 8, padding: '8px 10px',
    fontSize: 13, outline: 'none', color: '#1a1a2e', background: '#fff', ...extra,
  })
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', display: 'block', marginBottom: 4 }
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }

  return (
    <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Desglose de costes</h2>
      </div>
      <div style={{ padding: '20px' }}>

        {/* Rate / breakdown */}
        <div style={{ marginBottom: 16 }}>
          {rangeBreakdown.length > 1 ? (
            <>
              <label style={lbl}>Precio por tramos (€)</label>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                {rangeBreakdown.map((g, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', padding: '3px 0' }}>
                    <span>{g.price}€/n × {g.count} noche{g.count > 1 ? 's' : ''}</span>
                    <strong style={{ color: '#1a1a2e' }}>{g.price * g.count}€</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <label style={lbl}>Precio por noche (€)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} min={0}
                  style={{ ...inp(), width: 90 }} />
                {nights > 0 && (
                  <span style={{ fontSize: 13, color: '#888' }}>× {nights} noche{nights > 1 ? 's' : ''} = <strong style={{ color: '#1a1a2e' }}>{base}€</strong></span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cleaning fee */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Gastos de limpieza (€) — 0 para eximir</label>
          <input type="number" value={cleaningFee} onChange={e => setCleaningFee(Number(e.target.value))} min={0}
            style={{ ...inp(), width: 90 }} />
        </div>

        {/* Extras list */}
        {extras.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Extras</label>
            {extras.map((e, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: 8, marginBottom: 4, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, color: '#1a1a2e' }}>
                  {e.name}{e.quantity && e.quantity > 1 ? ` · ${e.quantity} ${e.unit ?? 'uds'}` : ''} — <strong>{e.amount * (e.quantity ?? 1)}€</strong>
                </span>
                <button onClick={() => removeExtra(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 2 }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add custom extra */}
        <div style={{ marginBottom: 20, background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
          <label style={lbl}>Añadir extra</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <span style={{ ...lbl, fontSize: 10 }}>Nombre</span>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Cuna, parking..." style={{ ...inp(), width: 140 }} />
            </div>
            <div>
              <span style={{ ...lbl, fontSize: 10 }}>Importe (€)</span>
              <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} min={0} placeholder="0" style={{ ...inp(), width: 70 }} />
            </div>
            <div>
              <span style={{ ...lbl, fontSize: 10 }}>Cant.</span>
              <input type="number" value={newQty} onChange={e => setNewQty(e.target.value)} min={1} style={{ ...inp(), width: 50 }} />
            </div>
            <div>
              <span style={{ ...lbl, fontSize: 10 }}>Unidad</span>
              <input value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="días, uds..." style={{ ...inp(), width: 80 }} />
            </div>
            <button onClick={addCustom} disabled={!newName || !newAmount}
              style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: (!newName || !newAmount) ? 0.5 : 1 }}>
              <Plus size={12} /> Añadir
            </button>
          </div>
        </div>

        {/* Pagado a cuenta (pago por adelantado gestionado fuera de la plataforma) */}
        <div style={{ marginBottom: 16, background: '#f8fafc', borderRadius: 10, padding: 14, border: '1px solid #e2e8f0' }}>
          <label style={lbl}>Pagado a cuenta (€) — anticipo recibido por transferencia/otro medio</label>
          <input type="number" value={depositPaid} onChange={e => setDepositPaid(Number(e.target.value))} min={0}
            style={{ ...inp(), width: 90 }} />
        </div>

        {/* Total */}
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 12, marginBottom: 16 }}>
          {rangeBreakdown.length > 1 ? (
            rangeBreakdown.map((g, i) => (
              <div key={i} style={rowStyle}>
                <span style={{ color: '#888' }}>{g.price}€/n × {g.count} noche{g.count > 1 ? 's' : ''}</span>
                <span>{g.price * g.count}€</span>
              </div>
            ))
          ) : nights > 0 && (
            <div style={rowStyle}><span style={{ color: '#888' }}>Precio base ({nights} noches)</span><span>{base}€</span></div>
          )}
          {cleaningFee > 0 && (
            <div style={rowStyle}><span style={{ color: '#888' }}>Limpieza</span><span>{cleaningFee}€</span></div>
          )}
          {extras.map((e, i) => (
            <div key={i} style={rowStyle}>
              <span style={{ color: '#888' }}>{e.name}{e.quantity && e.quantity > 1 ? ` (${e.quantity})` : ''}</span>
              <span>{e.amount * (e.quantity ?? 1)}€</span>
            </div>
          ))}
          <div style={{ ...rowStyle, fontWeight: 700, fontSize: 16, color: '#4B766B', marginTop: 4 }}>
            <span>Total</span>
            <span>{total}€</span>
          </div>
          {depositPaid > 0 && (
            <>
              <div style={rowStyle}><span style={{ color: '#888' }}>Pagado a cuenta</span><span>−{depositPaid}€</span></div>
              <div style={{ ...rowStyle, fontWeight: 700, color: pending > 0 ? '#d97706' : '#4B766B' }}>
                <span>Pendiente de pago</span>
                <span>{pending}€</span>
              </div>
            </>
          )}
        </div>

        {error && <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 10 }}>{error}</p>}
        {saved && <p style={{ fontSize: 13, color: '#4B766B', marginBottom: 10, fontWeight: 600 }}>✓ Precio guardado</p>}

        <button onClick={handleSave} disabled={isPending}
          style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isPending ? 0.6 : 1 }}>
          {isPending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : 'Guardar precio'}
        </button>

        {/* Presupuesto al cliente */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
          <label style={lbl}>Mensaje para el cliente (opcional)</label>
          <textarea
            value={quoteMessage}
            onChange={e => setQuoteMessage(e.target.value)}
            placeholder="Ej: Para confirmar tu reserva necesitamos un pago del 10% por transferencia. Te paso los datos bancarios…"
            rows={4}
            style={{ ...inp(), width: '100%', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 12 }}
          />

          {(quoteStatus === 'quote_sent' || quoteStatus === 'quote_accepted') && (
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              {quoteStatus === 'quote_accepted'
                ? `✓ Presupuesto aceptado por el cliente${quoteAcceptedAt ? ` el ${new Date(quoteAcceptedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.`
                : `Presupuesto enviado${quoteSentAt ? ` el ${new Date(quoteSentAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}, esperando respuesta del cliente.`}
            </p>
          )}

          {quoteError && <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 10 }}>{quoteError}</p>}
          {quoteSent && <p style={{ fontSize: 13, color: '#4B766B', marginBottom: 10, fontWeight: 600 }}>✓ Presupuesto enviado al cliente</p>}

          <button onClick={handleSendQuote} disabled={isSending}
            style={{ background: '#fff', color: '#4B766B', border: '1.5px solid #4B766B', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isSending ? 0.6 : 1 }}>
            {isSending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            {quoteStatus === 'quote_sent' || quoteStatus === 'quote_accepted' ? 'Reenviar presupuesto' : 'Enviar presupuesto'}
          </button>
        </div>

      </div>
    </section>
  )
}
