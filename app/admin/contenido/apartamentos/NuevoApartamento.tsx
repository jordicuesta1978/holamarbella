'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { createApartamento } from '../actions'

const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }
const hint: React.CSSProperties = { display: 'block', fontSize: 11, color: '#aaa', fontStyle: 'italic', marginBottom: 4 }
const inp: React.CSSProperties = { width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }

export default function NuevoApartamento() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(fd: FormData) {
    setError(null)
    setDone(null)
    startTransition(async () => {
      const res = await createApartamento({
        name: (fd.get('name') as string) || '',
        title: (fd.get('title') as string) || '',
        subtitle: (fd.get('subtitle') as string) || '',
        description: (fd.get('description') as string) || '',
        persons: Number(fd.get('persons')),
        bedrooms: Number(fd.get('bedrooms')),
        bed: (fd.get('bed') as string) || '',
        bathrooms: Number(fd.get('bathrooms')),
        license: (fd.get('license') as string) || '',
        price_min: Number(fd.get('price_min')),
        price_max: Number(fd.get('price_max')),
      })
      if (!res.ok) { setError(res.error); return }
      setDone(res.slug)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: open ? '1px solid #f0f0f0' : undefined }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Nuevo apartamento</h2>
          {done && !open && (
            <span style={{ fontSize: 12, color: '#4B766B' }}>
              Creado ({done}). Está <strong>inactivo</strong>: sube las fotos, revisa los datos y marca &quot;Activo&quot; para publicarlo.
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setOpen(v => !v); setError(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: open ? '#fff' : '#4B766B', color: open ? '#4B766B' : '#fff', border: '1px solid #4B766B', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {open ? 'Cancelar' : <><Plus size={14} /> Añadir apartamento</>}
        </button>
      </div>

      {open && (
        <form action={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
            Se crea <strong>inactivo</strong> (no sale en la web). Después podrás subir fotos y vídeos, poner precios, bloqueos y traducciones, y activarlo cuando esté listo.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={lbl}>Nombre corto *</label>
              <span style={hint}>Ej: Mirador. Se usa en el admin y en la dirección web</span>
              <input name="name" required placeholder="Mirador" style={inp} />
            </div>
            <div>
              <label style={lbl}>Título completo</label>
              <span style={hint}>Ej: Mirador · Casco Antiguo · Vistas al mar (si se deja vacío, se usa el nombre)</span>
              <input name="title" placeholder="Mirador · Casco Antiguo · Vistas al mar" style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Subtítulo</label>
            <input name="subtitle" placeholder="Casco Antiguo · Playa a 5 minutos" style={inp} />
          </div>

          <div>
            <label style={lbl}>Descripción</label>
            <textarea name="description" rows={3} style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            <div><label style={lbl}>Personas</label><input name="persons" type="number" min={1} max={10} defaultValue={2} style={inp} /></div>
            <div><label style={lbl}>Dormitorios</label><input name="bedrooms" type="number" min={0} max={10} defaultValue={1} style={inp} /></div>
            <div><label style={lbl}>Baños</label><input name="bathrooms" type="number" min={1} max={5} defaultValue={1} style={inp} /></div>
            <div><label style={lbl}>Tipo cama</label><input name="bed" placeholder="1 cama doble 1,60m" style={inp} /></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
            <div><label style={lbl}>Licencia VFT</label><input name="license" placeholder="VFT/MA/000000" style={inp} /></div>
            <div><label style={lbl}>Precio mín €/n *</label><input name="price_min" type="number" min={1} required style={inp} /></div>
            <div><label style={lbl}>Precio máx €/n *</label><input name="price_max" type="number" min={1} required style={inp} /></div>
          </div>

          {error && <p style={{ margin: 0, fontSize: 12, color: '#e53e3e' }}>Error: {error}</p>}

          <div>
            <button type="submit" disabled={isPending} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: isPending ? 'wait' : 'pointer' }}>
              {isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Crear apartamento
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
