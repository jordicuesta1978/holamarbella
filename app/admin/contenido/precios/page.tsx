import { getPrecios, addPrecio, deletePrecio } from '../actions'

const APTS = [
  { slug: 'paloma', label: 'Paloma' },
  { slug: 'micu', label: 'Micu' },
  { slug: 'larysol', label: 'Larysol' },
  { slug: 'ami', label: 'AMI' },
  { slug: 'banesto', label: 'Banesto' },
]

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function PreciosPage() {
  const precios = await getPrecios().catch(() => [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              {APTS.map(a => <option key={a.slug} value={a.slug}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Desde</label>
            <input type="date" name="desde" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Hasta</label>
            <input type="date" name="hasta" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>€ / noche</label>
            <input type="number" name="precio" min={1} required placeholder="90" style={{ width: 80, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Añadir
          </button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Tarifas configuradas ({precios.length})</h2>
        </div>
        {precios.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay tarifas configuradas</p>
        ) : precios.map((p: { id: number; apartment_slug: string; fecha_inicio: string; fecha_fin: string; precio_noche: number }, i: number) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < precios.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '3px 8px', textAlign: 'center' }}>
              {APTS.find(a => a.slug === p.apartment_slug)?.label ?? p.apartment_slug}
            </span>
            <span style={{ flex: 1, fontSize: 13, color: '#1a1a2e' }}>
              {fmt(p.fecha_inicio)} → {fmt(p.fecha_fin)}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#4B766B' }}>{p.precio_noche}€/noche</span>
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
    </div>
  )
}
