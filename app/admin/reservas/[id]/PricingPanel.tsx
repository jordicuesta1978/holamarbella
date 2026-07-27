'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { savePricing, updateReservaStatus, type Extra } from '@/app/actions/admin'
import { sendQuote } from '@/app/actions/presupuesto'
import { Plus, X, Loader2, Send, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

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

type VolumeDiscount = { start: string; end: string; minNights: number; percentage: number }

// Same logic as lib/pricing.ts computeVolumeDiscount — duplicated here (not
// imported) so this client component never pulls in the server-only Supabase
// admin client that lib/pricing.ts's module graph depends on.
function computeVolumeDiscount(
  rules: VolumeDiscount[],
  checkIn: string,
  nights: number,
  subtotal: number,
): { percentage: number; amount: number } | null {
  if (!checkIn || nights <= 0 || subtotal <= 0) return null
  const matches = rules.filter(r => checkIn >= r.start && checkIn < r.end && nights >= r.minNights)
  if (matches.length === 0) return null
  const best = matches.reduce((a, b) => (b.percentage > a.percentage ? b : a))
  return { percentage: best.percentage, amount: Math.round(subtotal * best.percentage / 100) }
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
  volumeDiscounts?: VolumeDiscount[]
  checkIn?: string
  checkOut?: string
  initialQuoteMessage?: string
  quoteStatus?: string
  quoteSentAt?: string | null
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
  volumeDiscounts = [],
  checkIn,
  checkOut,
  initialQuoteMessage = '',
  quoteStatus,
  quoteSentAt,
}: Props) {
  const router = useRouter()
  const midPrice = Math.round((priceMin + priceMax) / 2)

  // Compute per-range breakdown (same logic as CalendarPicker)
  const rangeNights = (priceRanges.length > 0 && checkIn && checkOut)
    ? calcNightlyPrices(checkIn, checkOut, priceRanges, midPrice)
    : []
  const rangeBreakdown = groupBreakdown(rangeNights)
  // Fallback rate (only used when no price range matches these dates at all):
  // back-calculate from the saved total, or fall back to the apartment's mid price
  const defaultRate = initialTotal && nights > 0
    ? Math.round((initialTotal - initialCleaningFee - initialExtras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)) / nights)
    : midPrice

  const [rate, setRate] = useState(defaultRate)
  // Every matched price tramo (even a single one) becomes an editable/removable
  // row, so a manual edit always takes effect — it's never silently overridden
  // by the configured range price.
  const [tierRows, setTierRows] = useState<Array<{ label: string; amount: number }>>(() =>
    rangeBreakdown.map(g => ({ label: `${g.price}€/n × ${g.count} noche${g.count > 1 ? 's' : ''}`, amount: g.price * g.count }))
  )
  // Automatic volume discount, recomputed from the current rules — editable
  // and removable just like the tramos, in case the admin wants to override it.
  const [discountRow, setDiscountRow] = useState<{ label: string; amount: number } | null>(() => {
    if (!checkIn || nights <= 0) return null
    const rangeBase = rangeBreakdown.reduce((s, g) => s + g.price * g.count, 0)
    const rawSubtotal = rangeBase > 0 ? rangeBase : defaultRate * nights
    const match = computeVolumeDiscount(volumeDiscounts, checkIn, nights, rawSubtotal)
    return match ? { label: `Descuento estancia larga (-${match.percentage}%)`, amount: -match.amount } : null
  })
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

  const [isActionPending, startActionTransition] = useTransition()
  const [actionDone, setActionDone] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelMsg, setCancelMsg] = useState('')

  // base: editable tier rows when there were multiple price tramos; otherwise
  // the range base (single tramo) or manual rate × nights
  const tierRowsTotal = tierRows.reduce((s, r) => s + r.amount, 0)
  const base = (tierRows.length > 0 ? tierRowsTotal : rate * nights) + (discountRow?.amount ?? 0)
  const extrasTotal = extras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)
  const total = base + cleaningFee + extrasTotal
  const pending = Math.max(total - depositPaid, 0)

  const updateTierAmount = (i: number, amount: number) =>
    setTierRows(prev => prev.map((r, idx) => idx === i ? { ...r, amount } : r))
  const removeTierRow = (i: number) => setTierRows(prev => prev.filter((_, idx) => idx !== i))

  const updateDiscountAmount = (amount: number) =>
    setDiscountRow(prev => prev ? { ...prev, amount } : prev)
  const removeDiscountRow = () => setDiscountRow(null)

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

  // Aprobar/rechazar siempre guardan el precio vigente primero, para que un
  // anticipo o ajuste de precio sin guardar nunca se pierda silenciosamente.
  const handleApprove = () => {
    setActionError(null)
    startActionTransition(async () => {
      try {
        await savePricing(id, cleaningFee, extras, base, depositPaid)
        await updateReservaStatus(id, 'confirmed')
        setActionDone(true)
        router.refresh()
      } catch {
        setActionError('Error al actualizar la reserva. Inténtalo de nuevo.')
      }
    })
  }

  const handleRejectSubmit = () => {
    setActionError(null)
    startActionTransition(async () => {
      try {
        await savePricing(id, cleaningFee, extras, base, depositPaid)
        await updateReservaStatus(id, 'cancelled', cancelMsg.trim() || undefined)
        setActionDone(true)
        setShowCancelModal(false)
        router.refresh()
      } catch {
        setActionError('Error al actualizar la reserva. Inténtalo de nuevo.')
      }
    })
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1.5px solid #d1d5db', borderRadius: 8, padding: '8px 10px',
    fontSize: 13, outline: 'none', color: '#1a1a2e', background: '#fff', ...extra,
  })
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', display: 'block', marginBottom: 4 }
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }

  const showActions = ['pending', 'quote_sent'].includes(quoteStatus ?? '') && !actionDone

  return (
    <>
    <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Desglose de costes</h2>
      </div>
      <div style={{ padding: '20px' }}>

        {/* Rate / breakdown */}
        <div style={{ marginBottom: 16 }}>
          {tierRows.length > 0 ? (
            <>
              <label style={lbl}>Precio por tramos (€)</label>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                {tierRows.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#555', padding: '3px 0', gap: 8 }}>
                    <span style={{ flex: 1 }}>{r.label}</span>
                    <input type="number" value={r.amount} onChange={e => updateTierAmount(i, Number(e.target.value))} min={0}
                      style={{ ...inp(), width: 80 }} />
                    <button onClick={() => removeTierRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 2 }}>
                      <X size={14} />
                    </button>
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

        {/* Automatic volume discount */}
        {discountRow && (
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Descuento por volumen de noches</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f9f6', borderRadius: 8, padding: '10px 14px', border: '1px solid #b2d4cc', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: '#4B766B' }}>{discountRow.label}</span>
              <input type="number" value={discountRow.amount} onChange={e => updateDiscountAmount(Number(e.target.value))}
                style={{ ...inp(), width: 80 }} />
              <button onClick={removeDiscountRow} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 2 }}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

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
          {tierRows.length > 0 ? (
            tierRows.map((r, i) => (
              <div key={i} style={rowStyle}>
                <span style={{ color: '#888' }}>{r.label}</span>
                <span>{r.amount}€</span>
              </div>
            ))
          ) : nights > 0 && (
            <div style={rowStyle}><span style={{ color: '#888' }}>Precio base ({nights} noches)</span><span>{rate * nights}€</span></div>
          )}
          {discountRow && (
            <div style={rowStyle}><span style={{ color: '#4B766B' }}>{discountRow.label}</span><span style={{ color: '#4B766B' }}>{discountRow.amount}€</span></div>
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

          {quoteStatus === 'quote_sent' && (
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              {`Presupuesto enviado${quoteSentAt ? ` el ${new Date(quoteSentAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}.`}
            </p>
          )}

          {quoteError && <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 10 }}>{quoteError}</p>}
          {quoteSent && <p style={{ fontSize: 13, color: '#4B766B', marginBottom: 10, fontWeight: 600 }}>✓ Presupuesto enviado al cliente</p>}

          <button onClick={handleSendQuote} disabled={isSending}
            style={{ background: '#fff', color: '#4B766B', border: '1.5px solid #4B766B', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isSending ? 0.6 : 1 }}>
            {isSending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            {quoteStatus === 'quote_sent' ? 'Reenviar presupuesto' : 'Enviar presupuesto'}
          </button>
        </div>

      </div>
    </section>

    {actionDone && (
      <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 12, padding: '20px 24px', textAlign: 'center', fontSize: 14, color: '#065f46', fontWeight: 600, marginBottom: 16 }}>
        ✓ Estado actualizado. Email enviado al huésped.
      </div>
    )}

    {showActions && (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Acción</p>
        {depositPaid <= 0 && (
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#92400e',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              No hay ningún depósito registrado todavía. Lo habitual es aprobar la reserva solo cuando el cliente haya pagado el anticipo.
            </span>
          </div>
        )}
        {actionError && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>{actionError}</p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleApprove}
            disabled={isActionPending}
            style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: isActionPending ? 0.6 : 1 }}
          >
            {isActionPending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={16} />}
            Aprobar reserva
          </button>
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={isActionPending}
            style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#e53e3e', border: '1.5px solid #e53e3e', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: isActionPending ? 0.6 : 1 }}
          >
            <XCircle size={16} />
            Rechazar
          </button>
        </div>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: '#aaa' }}>Se guardará el precio actual y se enviará un email al huésped con el mensaje que escribas.</p>
      </div>
    )}

    {showCancelModal && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 24px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Mensaje al huésped</h2>
            <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 4 }}>
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
              onClick={() => setShowCancelModal(false)}
              style={{ flex: 1, background: '#f4f5f7', color: '#555', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleRejectSubmit}
              disabled={isActionPending}
              style={{ flex: 1, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isActionPending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {isActionPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              Rechazar y enviar email
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
