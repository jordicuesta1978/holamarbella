import { getResenas, saveResena, deleteResena, moveResena } from '../actions'

const APTS = [
  { slug: 'paloma', label: 'Paloma' },
  { slug: 'micu', label: 'Micu' },
  { slug: 'larysol', label: 'Larysol' },
  { slug: 'ami', label: 'AMI' },
  { slug: 'banesto', label: 'Banesto' },
]

export default async function ResenasPage() {
  const resenas = await getResenas().catch(() => [])
  const renderId = Date.now()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* New */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Nueva reseña</h2>
        </div>
        <form action={async (fd: FormData) => {
          'use server'
          const source = fd.get('source') as string
          await saveResena(null, {
            apartment_slug: (fd.get('apartment_slug') as string) || null,
            author: fd.get('author') as string,
            location: (fd.get('location') as string) || null,
            date: (fd.get('date') as string) || null,
            rating: Number(fd.get('rating')),
            text: (fd.get('text') as string) || null,
            source: source || null,
            source_url: (fd.get('source_url') as string) || null,
            featured: fd.get('featured') === 'on',
          })
        }} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Apartamento</label>
            <select name="apartment_slug" defaultValue="" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
              <option value="">Ninguno</option>
              {APTS.map(a => <option key={a.slug} value={a.slug}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Autor</label>
            <input type="text" name="author" required placeholder="Carlos · Madrid" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Localización</label>
            <input type="text" name="location" placeholder="Madrid" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Fecha</label>
            <input type="month" name="date" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>★</label>
            <input type="number" name="rating" min={1} max={5} step={0.1} defaultValue={5} required style={{ width: 70, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Fuente</label>
            <select name="source" defaultValue="" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
              <option value="">Ninguna</option>
              <option value="airbnb">Airbnb</option>
              <option value="google">Google</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>URL de la reseña original (opcional)</label>
            <input type="text" name="source_url" placeholder="https://..." style={{ width: 220, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
            <input type="checkbox" name="featured" id="featured" style={{ width: 16, height: 16 }} />
            <label htmlFor="featured" style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>Destacar en home</label>
          </div>
          <div style={{ width: '100%' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Texto</label>
            <textarea name="text" rows={3} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Añadir reseña
          </button>
        </form>
      </div>

      {/* List with sort */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Reseñas ({resenas.length})</h2>
          <span style={{ fontSize: 11, color: '#aaa' }}>Usa ↑↓ para reordenar</span>
        </div>
        {resenas.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay reseñas</p>
        ) : resenas.map((r: { id: number; apartment_slug: string | null; author: string; location: string | null; date: string | null; rating: number; text: string | null; source?: string | null; source_url?: string | null; featured?: boolean }, i: number) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 20px', borderBottom: i < resenas.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            {/* Sort buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, paddingTop: 2 }}>
              <form action={async () => {
                'use server'
                await moveResena(r.id, 'up')
              }}>
                <button
                  type="submit"
                  disabled={i === 0}
                  style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}
                  title="Subir"
                >
                  ↑
                </button>
              </form>
              <form action={async () => {
                'use server'
                await moveResena(r.id, 'down')
              }}>
                <button
                  type="submit"
                  disabled={i === resenas.length - 1}
                  style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', fontSize: 10, cursor: i === resenas.length - 1 ? 'default' : 'pointer', opacity: i === resenas.length - 1 ? 0.3 : 1 }}
                  title="Bajar"
                >
                  ↓
                </button>
              </form>
            </div>

            <span style={{ width: 70, fontSize: 11, fontWeight: 700, color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '3px 8px', textAlign: 'center', flexShrink: 0, marginTop: 2 }}>
              {r.apartment_slug ? (APTS.find(a => a.slug === r.apartment_slug)?.label ?? r.apartment_slug) : '—'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
                {r.author}
                {' '}<span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(r.rating))}</span>
                {' '}<span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>{r.date}</span>
                {r.source && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: r.source === 'airbnb' ? '#FF5A5F' : '#4285F4', background: r.source === 'airbnb' ? '#fff1f1' : '#f0f6ff', borderRadius: 6, padding: '2px 6px' }}>
                    {r.source}
                  </span>
                )}
                {r.featured && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '2px 6px' }}>
                    ★ destacada
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2, lineHeight: 1.5 }}>{r.text}</div>
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#4B766B' }}>
                  Ver reseña original ↗
                </a>
              )}
              <details key={`${r.id}-${renderId}`} style={{ marginTop: 8 }}>
                <summary style={{ fontSize: 11, color: '#4B766B', cursor: 'pointer', fontWeight: 700 }}>Editar</summary>
                <form action={async (fd: FormData) => {
                  'use server'
                  const source = fd.get('source') as string
                  await saveResena(r.id, {
                    apartment_slug: (fd.get('apartment_slug') as string) || null,
                    author: fd.get('author') as string,
                    location: (fd.get('location') as string) || null,
                    date: (fd.get('date') as string) || null,
                    rating: Number(fd.get('rating')),
                    text: (fd.get('text') as string) || null,
                    source: source || null,
                    source_url: (fd.get('source_url') as string) || null,
                    featured: fd.get('featured') === 'on',
                  })
                }} style={{ padding: 12, marginTop: 6, background: '#f8fafc', borderRadius: 8, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Apartamento</label>
                    <select name="apartment_slug" defaultValue={r.apartment_slug ?? ''} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
                      <option value="">Ninguno</option>
                      {APTS.map(a => <option key={a.slug} value={a.slug}>{a.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Autor</label>
                    <input type="text" name="author" defaultValue={r.author} required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Localización</label>
                    <input type="text" name="location" defaultValue={r.location ?? ''} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Fecha</label>
                    <input type="month" name="date" defaultValue={r.date ?? ''} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>★</label>
                    <input type="number" name="rating" min={1} max={5} step={0.1} defaultValue={r.rating} required style={{ width: 70, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Fuente</label>
                    <select name="source" defaultValue={r.source ?? ''} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
                      <option value="">Ninguna</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="google">Google</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>URL de la reseña original (opcional)</label>
                    <input type="text" name="source_url" defaultValue={r.source_url ?? ''} placeholder="https://..." style={{ width: 220, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 18 }}>
                    <input type="checkbox" name="featured" id={`featured-${r.id}`} defaultChecked={!!r.featured} style={{ width: 16, height: 16 }} />
                    <label htmlFor={`featured-${r.id}`} style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>Destacar en home</label>
                  </div>
                  <div style={{ width: '100%' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Texto</label>
                    <textarea name="text" defaultValue={r.text ?? ''} rows={3} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Guardar cambios
                  </button>
                </form>
              </details>
            </div>
            <form action={async () => {
              'use server'
              await deleteResena(r.id)
            }}>
              <button type="submit" style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
