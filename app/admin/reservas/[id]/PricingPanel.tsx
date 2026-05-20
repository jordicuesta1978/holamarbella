'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { savePricing, type Extra } from '@/app/actions/admin'
import { Plus, X, Loader2 } from 'lucide-react'

type Props = {
  id: number
  nights: number
  priceMin: number
  priceMax: number
  initialCleaningFee: number
  initialExtras: Extra[]
  initialTotal: number | null
}

const PRESETS: Array<{ name: string; amount: number; unit?: string }> = [
  { name: 'Parking', amount: 10, unit: 'días' },
  { name: 'Cuna', amount: 25 },
  { name: 'Servicio de limpieza adicional', amount: 40 },
]

export default function PricingPanel({
  id,
  nights,
  priceMin,
  priceMax,
  initialCleaningFee,
  initialExtras,
  initialTotal,
}: Props) {
  const router = useRouter()
  const defaultRate = Math.round((priceMin + priceMax) / 2)

  const [rate, setRate] = useState(
    initialTotal && nights > 0
      ? Math.round((initialTotal - initialCleaningFee - initialExtras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)) / nights)
      : defaultRate
  )
  const [cleaningFee, setCleaningFee] = useState(initialCleaningFee)
  const [extras, setExtras] = useState<Extra[]>(initialExtras)

  // new extra form
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newQty, setNewQty] = useState('1')
  const [newUnit, setNewUnit] = useState('')

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const base = rate * nights
  const extrasTotal = extras.reduce((s, e) => s + e.amount * (e.quantity ?? 1), 0)
  const total = base + cleaningFee + extrasTotal

  const addPreset = (preset: typeof PRESETS[0]) => {
    setExtras(prev => [...prev, { name: preset.name, amount: preset.amount, quantity: 1, unit: preset.unit }])
  }

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
        await savePricing(id, cleaningFee, extras, base)
        setSaved(true)
        router.refresh()
      } catch {
        setError('Error al guardar. Inténtalo de nuevo.')
      }
    })
  }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px',
    fontSize: 13, outline: 'none', color: '#1a1a2e', ...extra,
  })
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', display: 'block', marginBottom: 4 }
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 13 }

  return (
    <section style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
        <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Desglose de costes</h2>
      </div>
      <div style={{ padding: '20px' }}>

        {/* Rate × nights */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Precio por noche (€)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={rate} onChange={e => setRate(Number(e.target.value))} min={0}
              style={{ ...inp(), width: 90 }} />
            {nights > 0 && (
              <span style={{ fontSize: 13, color: '#888' }}>× {nights} noche{nights > 1 ? 's' : ''} = <strong style={{ color: '#1a1a2e' }}>{base}€</strong></span>
            )}
          </div>
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
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: 8, marginBottom: 4 }}>
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

        {/* Add extra presets */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Añadir extra rápido</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button key={p.name} onClick={() => addPreset(p)}
                style={{ background: '#f0f9f6', border: '1px solid #4B766B', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#4B766B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={11} />{p.name} ({p.amount}€)
              </button>
            ))}
          </div>
        </div>

        {/* Add custom extra */}
        <div style={{ marginBottom: 20, background: '#f8fafc', borderRadius: 10, padding: 14 }}>
          <label style={lbl}>Extra personalizado</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <span style={{ ...lbl, fontSize: 10 }}>Nombre</span>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Cuna, servicio..." style={{ ...inp(), width: 140 }} />
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

        {/* Total */}
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: 12, marginBottom: 16 }}>
          {nights > 0 && (
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
        </div>

        {error && <p style={{ fontSize: 13, color: '#e53e3e', marginBottom: 10 }}>{error}</p>}
        {saved && <p style={{ fontSize: 13, color: '#4B766B', marginBottom: 10, fontWeight: 600 }}>✓ Precio guardado</p>}

        <button onClick={handleSave} disabled={isPending}
          style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: isPending ? 0.6 : 1 }}>
          {isPending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : 'Guardar precio'}
        </button>

      </div>
    </section>
  )
}
