import { getArticulos, saveArticulo, deleteArticulo } from '../actions'

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default async function BlogPage() {
  const articulos = await getArticulos().catch(() => [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Create new */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Nuevo artículo</h2>
        </div>
        <form action={async (fd: FormData) => {
          'use server'
          const titulo = fd.get('titulo') as string
          if (!titulo) return
          const slug = slugify(titulo)
          await saveArticulo(
            null,
            titulo,
            slug,
            fd.get('contenido') as string || '',
            fd.get('publicado') === 'on',
            fd.get('imagen_url') as string || '',
          )
        }} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Título</label>
              <input type="text" name="titulo" required placeholder="Título del artículo" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>URL imagen destacada</label>
              <input type="url" name="imagen_url" placeholder="https://..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Contenido</label>
            <textarea name="contenido" rows={8} placeholder="Escribe el artículo aquí..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" name="publicado" style={{ cursor: 'pointer' }} />
              Publicar en /informacion
            </label>
            <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Crear artículo
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Artículos ({articulos.length})</h2>
        </div>
        {articulos.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay artículos</p>
        ) : articulos.map((a: { id: number; titulo: string; slug: string; publicado: boolean; contenido: string; imagen_url?: string }, i: number) => (
          <div key={a.id} style={{ padding: '14px 20px', borderBottom: i < articulos.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {a.imagen_url && (
                  <img src={a.imagen_url} alt={a.titulo} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                )}
                <div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{a.titulo}</span>
                  <span style={{ marginLeft: 8, fontSize: 11, color: a.publicado ? '#4B766B' : '#d97706', fontWeight: 700, background: a.publicado ? '#f0f9f6' : '#fef3c7', borderRadius: 6, padding: '2px 8px' }}>
                    {a.publicado ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
              </div>
              <form action={async () => {
                'use server'
                await deleteArticulo(a.id)
              }}>
                <button type="submit" style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  Eliminar
                </button>
              </form>
            </div>
            <form action={async (fd: FormData) => {
              'use server'
              await saveArticulo(
                a.id,
                fd.get('titulo') as string,
                fd.get('slug') as string,
                fd.get('contenido') as string,
                fd.get('publicado') === 'on',
                fd.get('imagen_url') as string || '',
              )
            }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="text" name="titulo" defaultValue={a.titulo} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
                <input type="url" name="imagen_url" defaultValue={a.imagen_url ?? ''} placeholder="URL imagen destacada" style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
              </div>
              <input type="text" name="slug" defaultValue={a.slug} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', color: '#888', fontFamily: 'monospace' }} />
              <textarea name="contenido" defaultValue={a.contenido} rows={4} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" name="publicado" defaultChecked={a.publicado} />
                  Publicado
                </label>
                <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
