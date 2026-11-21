'use client'

// HMB-001 — configurador del IVA de corta temporada (admin › Precios)
import { useState, useTransition } from 'react'
import { saveVatParams } from '@/app/admin/contenido/actions'
import { computeVat, type VatParams } from '@/lib/vat'

export default function IvaConfig({ initial }: { initial: VatParams }) {
  const [rate, setRate] = useState(initial.rate)
  const [maxNights, setMaxNights] = useState(initial.maxNights)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const exShort = computeVat(500, 5, { rate, maxNights })
  const exLong = maxNights + 1

  function save() {
    setMsg(null)
    startTransition(async () => {
      try {
        await saveVatParams(rate, maxNights)
        setMsg({ ok: true, text: 'Guardado' })
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : 'Error al guardar' })
      }
    })
  }

  const inp: React.CSSProperties = { width: 80, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }
  const lbl: React.CSSProperties = { fontSize: 12, color: '#64748b', display: 'block', marginBottom: 4 }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1e293b' }}>IVA corta temporada</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>Se aplica solo al alojamiento (no a limpieza ni extras) en estancias de hasta el número de noches indicado.</p>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={lbl}>IVA (%)</label>
          <input type="number" min={0} max={100} step={0.5} value={rate} onChange={e => setRate(Number(e.target.value))} style={inp} />
        </div>
        <div>
          <label style={lbl}>Hasta (noches)</label>
          <input type="number" min={0} step={1} value={maxNights} onChange={e => setMaxNights(Math.floor(Number(e.target.value)))} style={inp} />
        </div>
        <button onClick={save} disabled={isPending}
          style={{ padding: '8px 16px', background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </button>
        {msg && <span style={{ fontSize: 13, color: msg.ok ? '#4B766B' : '#dc2626' }}>{msg.text}</span>}
      </div>
      <div style={{ padding: '0 20px 16px', fontSize: 12, color: '#64748b' }}>
        Ejemplo: 5 noches con 500€ de alojamiento → IVA {exShort.amount}€. Estancias de {exLong} noches o más: sin IVA.
      </div>
    </div>
  )
}
