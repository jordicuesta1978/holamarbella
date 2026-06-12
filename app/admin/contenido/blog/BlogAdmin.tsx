'use client'

import { useState, useTransition } from 'react'
import ImageUploader from '@/components/ImageUploader'
import TipTapEditor from '@/components/TipTapEditor'
import { saveArticulo, deleteArticulo, type ArticuloRow } from '../actions'

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const label = (text: string) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#888', marginBottom: 4 }}>
    {text}
  </label>
)

const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', ...props.style }} />
)

// ── Nueva sección ────────────────────────────────────────────────────────────

function NuevoArticulo() {
  const [, startTransition] = useTransition()
  const [titulo, setTitulo] = useState('')

  function handleSubmit(fd: FormData) {
    const t = fd.get('titulo') as string
    if (!t) return
    startTransition(async () => {
      await saveArticulo(null, {
        titulo: t,
        slug: slugify(t),
        contenido: fd.get('contenido') as string || '',
        publicado: fd.get('publicado') === 'on',
        imagen_url: fd.get('imagen_url') as string || '',
        titulo_en: fd.get('titulo_en') as string || '',
        contenido_en: fd.get('contenido_en') as string || '',
        categoria: fd.get('categoria') as string || '',
        categoria_en: fd.get('categoria_en') as string || '',
        extracto: fd.get('extracto') as string || '',
        extracto_en: fd.get('extracto_en') as string || '',
        hero_image: fd.get('hero_image') as string || '',
      })
      setTitulo('')
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Nuevo artículo</h2>
      </div>
      <form action={handleSubmit} style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Títulos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {label('Título ES')}
            {input({ type: 'text', name: 'titulo', required: true, placeholder: 'Título del artículo', value: titulo, onChange: e => setTitulo(e.target.value) })}
          </div>
          <div>
            {label('Título EN')}
            {input({ type: 'text', name: 'titulo_en', placeholder: 'Article title (English)' })}
          </div>
        </div>

        {/* Categorías */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {label('Categoría ES')}
            {input({ type: 'text', name: 'categoria', placeholder: 'p.ej. Guías, Gastronomía…' })}
          </div>
          <div>
            {label('Categoría EN')}
            {input({ type: 'text', name: 'categoria_en', placeholder: 'e.g. Guides, Food…' })}
          </div>
        </div>

        {/* Extractos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {label('Extracto ES')}
            {input({ type: 'text', name: 'extracto', placeholder: 'Resumen breve (aparece en las cards)' })}
          </div>
          <div>
            {label('Extracto EN')}
            {input({ type: 'text', name: 'extracto_en', placeholder: 'Short summary (shown in cards)' })}
          </div>
        </div>

        {/* Imágenes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            {label('Imagen hero (URL)')}
            {input({ type: 'text', name: 'hero_image', placeholder: 'https://…' })}
          </div>
          <div>
            {label('Imagen destacada (subir)')}
            <ImageUploader bucket="blog" path="articulos/nueva" name="imagen_url" placeholder="URL o sube una imagen" />
          </div>
        </div>

        {/* Contenido ES */}
        <div>
          {label('Contenido ES')}
          <TipTapEditor name="contenido" minHeight={200} />
        </div>

        {/* Contenido EN */}
        <div>
          {label('Contenido EN')}
          <TipTapEditor name="contenido_en" minHeight={200} />
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
  )
}

// ── Fila de artículo existente ────────────────────────────────────────────────

function ArticuloRow({ a }: { a: ArticuloRow }) {
  const [, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleSave(fd: FormData) {
    startTransition(async () => {
      await saveArticulo(a.id, {
        titulo: fd.get('titulo') as string,
        slug: fd.get('slug') as string,
        contenido: fd.get('contenido') as string,
        publicado: fd.get('publicado') === 'on',
        imagen_url: fd.get('imagen_url') as string || '',
        titulo_en: fd.get('titulo_en') as string || '',
        contenido_en: fd.get('contenido_en') as string || '',
        categoria: fd.get('categoria') as string || '',
        categoria_en: fd.get('categoria_en') as string || '',
        extracto: fd.get('extracto') as string || '',
        extracto_en: fd.get('extracto_en') as string || '',
        hero_image: fd.get('hero_image') as string || '',
      })
      setExpanded(false)
    })
  }

  function handleDelete() {
    if (!window.confirm('¿Eliminar este artículo?')) return
    startTransition(async () => {
      await deleteArticulo(a.id)
    })
  }

  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f5f5f5' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {(a.hero_image ?? a.imagen_url) && (
            <img src={a.hero_image ?? a.imagen_url!} alt={a.titulo} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
          )}
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{a.titulo}</span>
            {a.categoria && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#e07b5a', fontWeight: 700, background: '#fff3ee', borderRadius: 6, padding: '2px 8px' }}>
                {a.categoria}
              </span>
            )}
            <span style={{ marginLeft: 8, fontSize: 11, color: a.publicado ? '#4B766B' : '#d97706', fontWeight: 700, background: a.publicado ? '#f0f9f6' : '#fef3c7', borderRadius: 6, padding: '2px 8px' }}>
              {a.publicado ? 'Publicado' : 'Borrador'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: '1px solid #e2e8f0', color: '#4B766B', borderRadius: 7, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            {expanded ? 'Cerrar' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Edit form — only mounted when expanded */}
      {expanded && (
        <form action={handleSave} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Títulos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Título ES')}
              {input({ type: 'text', name: 'titulo', defaultValue: a.titulo, required: true })}
            </div>
            <div>
              {label('Título EN')}
              {input({ type: 'text', name: 'titulo_en', defaultValue: a.titulo_en ?? '' })}
            </div>
          </div>

          {/* Slug */}
          <div>
            {label('Slug')}
            {input({ type: 'text', name: 'slug', defaultValue: a.slug, style: { fontFamily: 'monospace', color: '#888', fontSize: 12 } })}
          </div>

          {/* Categorías */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Categoría ES')}
              {input({ type: 'text', name: 'categoria', defaultValue: a.categoria ?? '' })}
            </div>
            <div>
              {label('Categoría EN')}
              {input({ type: 'text', name: 'categoria_en', defaultValue: a.categoria_en ?? '' })}
            </div>
          </div>

          {/* Extractos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Extracto ES')}
              {input({ type: 'text', name: 'extracto', defaultValue: a.extracto ?? '' })}
            </div>
            <div>
              {label('Extracto EN')}
              {input({ type: 'text', name: 'extracto_en', defaultValue: a.extracto_en ?? '' })}
            </div>
          </div>

          {/* Imágenes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Imagen hero (URL)')}
              {input({ type: 'text', name: 'hero_image', defaultValue: a.hero_image ?? '' })}
            </div>
            <div>
              {label('Imagen destacada')}
              <ImageUploader bucket="blog" path={`articulos/${a.id}`} name="imagen_url" defaultValue={a.imagen_url ?? ''} placeholder="URL o sube una imagen" />
            </div>
          </div>

          {/* Contenido ES */}
          <div>
            {label('Contenido ES')}
            <TipTapEditor name="contenido" defaultValue={a.contenido} minHeight={180} />
          </div>

          {/* Contenido EN */}
          <div>
            {label('Contenido EN')}
            <TipTapEditor name="contenido_en" defaultValue={a.contenido_en ?? ''} minHeight={180} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" name="publicado" defaultChecked={a.publicado} />
              Publicado
            </label>
            <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Guardar cambios
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function BlogAdmin({ articulos }: { articulos: ArticuloRow[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NuevoArticulo />

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Artículos ({articulos.length})</h2>
        </div>
        {articulos.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay artículos</p>
        ) : (
          articulos.map(a => <ArticuloRow key={a.id} a={a} />)
        )}
      </div>
    </div>
  )
}
