'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CalendarGrid, { type DayMark } from '@/components/CalendarGrid'
import { addPrecio, deletePrecio, addMinNights, deleteMinNights } from '@/app/admin/contenido/actions'

const APTS = [
  { slug: 'paloma', label: 'Paloma', priceBase: 115 },
  { slug: 'micu', label: 'Micu', priceBase: 107 },
  { slug: 'larysol', label: 'Larysol', priceBase: 122 },
  { slug: 'ami', label: 'AMI', priceBase: 130 },
  { slug: 'banesto', label: 'Banesto', priceBase: 137 },
]

type Precio = { id: number; apartment_slug: string; fecha_inicio: string; fecha_fin: string; precio_noche: number }
type MinNight = { id: number; apartment_slug: string; start_date: string | null; end_date: string | null; min_nights: number }

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function priceColor(price: number): string {
  if (price <= 80) return '#dbeafe'
  if (price <= 120) return '#d1fae5'
  if (price <= 160) return '#fef9c3'
  return '#fee2e2'
}

function buildMarks(precios: Precio[], slug: string): Record<string, DayMark> {
  const marks: Record<string, DayMark> = {}
  for (const p of precios.filter(p => p.apartment_slug === slug)) {
    const start = new Date(p.fecha_inicio + 'T00:00:00')
    const end = new Date(p.fecha_fin + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      marks[key] = { bg: priceColor(p.precio_noche), label: `${p.precio_noche}€` }
    }
  }
  return marks
}

export default function PreciosClient({ precios, minNights }: { precios: Precio[]; minNights: MinNight[] }) {
  const router = useRouter()
  const [slug, setSlug] = useState('paloma')
  const [isPending, startTransition] = useTransition()
  const now = new Date()

  const marks = buildMarks(precios, slug)
  const filteredPrecios = precios.filter(p => p.apartment_slug === slug)
  const filteredMN = minNights.filter(m => m.apartment_slug === slug)
  const aptInfo = APTS.find(a => a.slug === slug)!

  function handleAddPrecio(fd: FormData) {
    const desde = fd.get('desde') as string
    const hasta = fd.get('hasta') as string
    const precio = Number(fd.get('precio'))
    if (!desde || !hasta || precio <= 0 || desde >= hasta) return
    startTransition(async () => {
      await addPrecio(slug, desde, hasta, precio)
      router.refresh()
    })
  }

  function handleDelPrecio(id: number) {
    startTransition(async () => { await deletePrecio(id); router.refresh() })
  }

  function handleAddMN(fd: FormData) {
    const desde = (fd.get('desde') as string) || null
    const hasta = (fd.get('hasta') as string) || null
    const min = Number(fd.get('min'))
    if (min <= 0) return
    startTransition(async () => { await addMinNights(slug, desde, hasta, min); router.refresh() })
  }

  function handleDelMN(id: number) {
    startTransition(async () => { await deleteMinNights(id); router.refresh() })
  }

  const inp: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Selector */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Apartamento</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {APTS.map(a => (
            <button key={a.slug} onClick={() => setSlug(a.slug)} style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: slug === a.slug ? '#4B766B' : '#f8fafc',
              color: slug === a.slug ? '#fff' : '#555',
              border: `1.5px solid ${slug === a.slug ? '#4B766B' : '#e2e8f0'}`, cursor: 'pointer',
            }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
            Precios — {aptInfo.label} (base ~{aptInfo.priceBase}€/n)
          </h2>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <CalendarGrid
            markedDates={marks}
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth()}
            labelFontSize={10}
            legend={[
              { bg: '#dbeafe', label: '≤80€/n' },
              { bg: '#d1fae5', label: '81–120€/n' },
              { bg: '#fef9c3', label: '121–160€/n' },
              { bg: '#fee2e2', label: '>160€/n' },
            ]}
          />
        </div>
      </div>

      {/* Add precio */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Añadir tarifa — {aptInfo.label}</h2>
        </div>
        <form action={handleAddPrecio} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div><label style={lbl}>Desde</label><input type="date" name="desde" required style={inp} /></div>
          <div><label style={lbl}>Hasta (excl.)</label><input type="date" name="hasta" required style={inp} /></div>
          <div><label style={lbl}>€ / noche</label><input type="number" name="precio" min={1} required placeholder={String(aptInfo.priceBase)} style={{ ...inp, width: 90 }} /></div>
          <button type="submit" disabled={isPending} style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
            {isPending ? 'Guardando…' : 'Añadir tarifa'}
          </button>
        </form>
      </div>

      {/* Tarifas list */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Tarifas configuradas ({filteredPrecios.length})</h2>
        </div>
        {filteredPrecios.length === 0
          ? <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>Sin tarifas para {aptInfo.label}</p>
          : filteredPrecios.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < filteredPrecios.length - 1 ? '1px solid #f5f5f5' : undefined }}>
              <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>{fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#4B766B', background: priceColor(p.precio_noche), borderRadius: 6, padding: '2px 10px' }}>{p.precio_noche}€/n</span>
              <button onClick={() => handleDelPrecio(p.id)} disabled={isPending} style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          ))}
      </div>

      {/* Noches mínimas */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Noches mínimas — {aptInfo.label}</h2>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#aaa' }}>Sin rango de fechas = aplica siempre.</p>
        </div>
        <form action={handleAddMN} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div><label style={lbl}>Desde (opc.)</label><input type="date" name="desde" style={inp} /></div>
          <div><label style={lbl}>Hasta (opc.)</label><input type="date" name="hasta" style={inp} /></div>
          <div><label style={lbl}>Noches mín.</label><input type="number" name="min" min={1} max={365} defaultValue={2} required style={{ ...inp, width: 80 }} /></div>
          <button type="submit" disabled={isPending} style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
            Añadir regla
          </button>
        </form>
        {filteredMN.length === 0
          ? <p style={{ padding: '16px 20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>Sin reglas para {aptInfo.label}</p>
          : filteredMN.map((mn, i) => (
            <div key={mn.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < filteredMN.length - 1 ? '1px solid #f5f5f5' : undefined }}>
              <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>
                {mn.start_date ? `${fmt(mn.start_date)} → ${mn.end_date ? fmt(mn.end_date) : '∞'}` : 'Siempre'}
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, background: '#fef9c3', borderRadius: 6, padding: '2px 10px', color: '#1a1a2e' }}>{mn.min_nights} noches mín.</span>
              <button onClick={() => handleDelMN(mn.id)} disabled={isPending} style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}
