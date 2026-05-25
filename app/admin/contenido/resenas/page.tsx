import { getResenas, saveResena, deleteResena } from '../actions'

const APTS = [
  { slug: 'paloma', label: 'Paloma' },
  { slug: 'micu', label: 'Micu' },
  { slug: 'larysol', label: 'Larysol' },
  { slug: 'ami', label: 'AMI' },
  { slug: 'banesto', label: 'Banesto' },
]

export default async function ResenasPage() {
  const resenas = await getResenas().catch(() => [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* New */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Nueva reseña</h2>
        </div>
        <form action={async (fd: FormData) => {
          'use server'
          await saveResena(null, {
            apartment_slug: fd.get('apartment_slug') as string,
            author: fd.get('author') as string,
            location: fd.get('location') as string,
            date: fd.get('date') as string,
            rating: Number(fd.get('rating')),
            text: fd.get('text') as string,
          })
        }} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Apartamento</label>
            <select name="apartment_slug" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
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
            <input type="date" name="date" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Puntuación</label>
            <input type="number" name="rating" min={1} max={5} step={0.1} defaultValue={5} style={{ width: 70, border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ width: '100%' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Texto</label>
            <textarea name="text" required rows={3} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Añadir reseña
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Reseñas ({resenas.length})</h2>
        </div>
        {resenas.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay reseñas</p>
        ) : resenas.map((r: { id: number; apartment_slug: string; author: string; location: string; date: string; rating: number; text: string }, i: number) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 20px', borderBottom: i < resenas.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ width: 70, fontSize: 11, fontWeight: 700, color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '3px 8px', textAlign: 'center', flexShrink: 0, marginTop: 2 }}>
              {APTS.find(a => a.slug === r.apartment_slug)?.label ?? r.apartment_slug}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{r.author} <span style={{ color: '#f59e0b' }}>{'★'.repeat(Math.round(r.rating))}</span> <span style={{ fontWeight: 400, color: '#888', fontSize: 12 }}>{r.date}</span></div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 2, lineHeight: 1.5 }}>{r.text}</div>
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
