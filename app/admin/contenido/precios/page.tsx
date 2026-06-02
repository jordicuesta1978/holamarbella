import { getPrecios, addPrecio, deletePrecio, getMinNights, addMinNights, deleteMinNights } from '../actions'
import CalendarGrid, { type DayMark } from '@/components/CalendarGrid'

const APTS = [
  { slug: 'paloma', label: 'Paloma', priceBase: 115 },
  { slug: 'micu', label: 'Micu', priceBase: 107 },
  { slug: 'larysol', label: 'Larysol', priceBase: 122 },
  { slug: 'ami', label: 'AMI', priceBase: 130 },
  { slug: 'banesto', label: 'Banesto', priceBase: 137 },
]

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function priceColor(price: number): string {
  if (price <= 80) return '#dbeafe'   // blue-100 — económico
  if (price <= 120) return '#d1fae5'  // green-100 — normal
  if (price <= 160) return '#fef9c3'  // yellow-100 — temporada alta
  return '#fee2e2'                     // red-100 — precio máximo
}

function expandPrices(precios: { apartment_slug: string; fecha_inicio: string; fecha_fin: string; precio_noche: number }[]) {
  const marks: Record<string, DayMark> = {}
  for (const p of precios) {
    const start = new Date(p.fecha_inicio + 'T00:00:00')
    const end = new Date(p.fecha_fin + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      marks[key] = { bg: priceColor(p.precio_noche), label: `${p.precio_noche}€` }
    }
  }
  return marks
}

export default async function PreciosPage() {
  const [precios, minNights] = await Promise.all([
    getPrecios().catch(() => []),
    getMinNights().catch(() => []),
  ])
  const markedDates = expandPrices(precios)

  const now = new Date()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Vista de precios (todos los apartamentos)</h2>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <CalendarGrid
            markedDates={markedDates}
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth()}
            legend={[
              { bg: '#dbeafe', label: '≤80€/n' },
              { bg: '#d1fae5', label: '81–120€/n' },
              { bg: '#fef9c3', label: '121–160€/n' },
              { bg: '#fee2e2', label: '>160€/n' },
            ]}
          />
        </div>
      </div>

      {/* Add rate */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Añadir tarifa por rango de fechas</h2>
        </div>
        <form action={async (fd: FormData) => {
          'use server'
          const slug = fd.get('slug') as string
          const desde = fd.get('desde') as string
          const hasta = fd.get('hasta') as string
          const precio = Number(fd.get('precio'))
          if (slug && desde && hasta && precio > 0 && desde < hasta) await addPrecio(slug, desde, hasta, precio)
        }} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Apartamento</label>
            <select name="slug" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
              {APTS.map(a => <option key={a.slug} value={a.slug}>{a.label} (base ~{a.priceBase}€)</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Desde</label>
            <input type="date" name="desde" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Hasta (excl.)</label>
            <input type="date" name="hasta" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>€ / noche</label>
            <input type="number" name="precio" min={1} required placeholder="90" style={{ width: 90, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Añadir tarifa
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Tarifas configuradas ({precios.length})</h2>
        </div>
        {precios.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay tarifas configuradas</p>
        ) : precios.map((p: { id: number; apartment_slug: string; fecha_inicio: string; fecha_fin: string; precio_noche: number }, i: number) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < precios.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '3px 8px', textAlign: 'center', flexShrink: 0 }}>
              {APTS.find(a => a.slug === p.apartment_slug)?.label ?? p.apartment_slug}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>
              {fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#4B766B', background: priceColor(p.precio_noche), borderRadius: 6, padding: '2px 10px' }}>
              {p.precio_noche}€/n
            </span>
            <form action={async () => {
              'use server'
              await deletePrecio(p.id)
            }}>
              <button type="submit" style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>

      {/* ── NOCHES MÍNIMAS ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Noches mínimas por apartamento</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>Define estancias mínimas por temporada. Sin rango = aplica siempre. Con rango = aplica sólo en esas fechas.</p>
        </div>
        <form action={async (fd: FormData) => {
          'use server'
          const slug = fd.get('slug') as string
          const desde = (fd.get('desde') as string) || null
          const hasta = (fd.get('hasta') as string) || null
          const min = Number(fd.get('min'))
          if (slug && min > 0) await addMinNights(slug, desde, hasta, min)
        }} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Apartamento</label>
            <select name="slug" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
              {APTS.map(a => <option key={a.slug} value={a.slug}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Desde (opcional)</label>
            <input type="date" name="desde" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Hasta (opcional)</label>
            <input type="date" name="hasta" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Noches mín.</label>
            <input type="number" name="min" min={1} max={365} defaultValue={2} required style={{ width: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Añadir regla
          </button>
        </form>

        {minNights.length === 0 ? (
          <p style={{ padding: '16px 20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>
            No hay reglas configuradas. La tabla se activará una vez creada en Supabase.
          </p>
        ) : minNights.map((mn: { id: number; apartment_slug: string; start_date: string | null; end_date: string | null; min_nights: number }, i: number) => (
          <div key={mn.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < minNights.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '3px 8px', textAlign: 'center', flexShrink: 0 }}>
              {APTS.find(a => a.slug === mn.apartment_slug)?.label ?? mn.apartment_slug}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>
              {mn.start_date ? `${fmt(mn.start_date)} → ${mn.end_date ? fmt(mn.end_date) : '∞'}` : 'Siempre'}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e', background: '#fef9c3', borderRadius: 6, padding: '2px 10px' }}>
              {mn.min_nights} noches mín.
            </span>
            <form action={async () => {
              'use server'
              await deleteMinNights(mn.id)
            }}>
              <button type="submit" style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
