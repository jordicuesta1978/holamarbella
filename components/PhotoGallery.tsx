'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Star, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

type Photo = { path: string; url: string; isPrimary: boolean }

type Props = {
  slug: string
  initialPhotos: Photo[]
  onPrimaryChange: (path: string) => Promise<void>
  /** Called with the full ordered array of paths whenever order or primary changes */
  onOrderChange?: (orderedPaths: string[]) => Promise<void>
}

export default function PhotoGallery({ slug, initialPhotos, onPrimaryChange, onOrderChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function saveOrder(ordered: Photo[]) {
    const paths = ordered.map(p => p.path)
    const primaryPath = ordered[0]?.path
    if (onOrderChange) {
      await onOrderChange(paths).catch(() => {})
    } else if (primaryPath) {
      await onPrimaryChange(primaryPath).catch(() => {})
    }
  }

  async function handleUpload(files: FileList) {
    setUploading(true)
    setError(null)
    const uploaded: Photo[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${slug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'apartamentos')
      fd.append('path', path)

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) {
        uploaded.push({ path: json.path, url: json.url, isPrimary: false })
      } else {
        setError(json.error || 'Error al subir imagen')
      }
    }

    if (uploaded.length > 0) {
      setPhotos(prev => {
        const noneIsPrimary = prev.every(p => !p.isPrimary)
        const updated = [...prev, ...uploaded.map((p, i) => ({
          ...p, isPrimary: noneIsPrimary && i === 0 && prev.length === 0,
        }))]
        saveOrder(updated)
        return updated
      })
    }
    setUploading(false)
  }

  async function handleDelete(path: string) {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'apartamentos', path }),
    })
    setPhotos(prev => {
      const wasFirst = prev[0]?.path === path
      const next = prev.filter(p => p.path !== path)
      if (wasFirst && next.length > 0) next[0].isPrimary = true
      saveOrder(next)
      return next
    })
  }

  async function handleSetPrimary(path: string) {
    setPhotos(prev => {
      // Move to front, mark as primary
      const target = prev.find(p => p.path === path)!
      const rest = prev.filter(p => p.path !== path)
      const updated = [{ ...target, isPrimary: true }, ...rest.map(p => ({ ...p, isPrimary: false }))]
      saveOrder(updated)
      return updated
    })
  }

  function handleMove(idx: number, dir: -1 | 1) {
    setPhotos(prev => {
      const next = [...prev]
      const target = idx + dir
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]]
      // Primary is always index 0
      const updated = next.map((p, i) => ({ ...p, isPrimary: i === 0 }))
      saveOrder(updated)
      return updated
    })
  }

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    background: active ? '#4B766B' : 'white',
    color: active ? 'white' : '#6b7280',
    border: `1px solid ${active ? '#4B766B' : '#e2e8f0'}`,
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  })

  const iconBtn: React.CSSProperties = {
    background: 'white',
    color: '#6b7280',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '4px 6px',
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div>
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 12 }}>
          {photos.map((p, idx) => (
            <div key={p.path} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: p.isPrimary ? '2px solid #4B766B' : '1px solid #e2e8f0', background: '#f8fafc' }}>
              <img src={p.url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              {p.isPrimary && (
                <span style={{ position: 'absolute', top: 4, left: 4, background: '#4B766B', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  PRINCIPAL
                </span>
              )}
              <div style={{ display: 'flex', gap: 3, padding: '5px 5px', background: 'rgba(255,255,255,0.96)', flexWrap: 'wrap' }}>
                {/* Move left */}
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} style={{ ...iconBtn, opacity: idx === 0 ? 0.3 : 1 }} title="Mover izquierda">
                  <ChevronLeft size={11} />
                </button>
                {/* Move right */}
                <button onClick={() => handleMove(idx, 1)} disabled={idx === photos.length - 1} style={{ ...iconBtn, opacity: idx === photos.length - 1 ? 0.3 : 1 }} title="Mover derecha">
                  <ChevronRight size={11} />
                </button>
                {/* Set primary (only if not already) */}
                {!p.isPrimary && (
                  <button onClick={() => handleSetPrimary(p.path)} style={btnStyle()} title="Marcar como principal">
                    <Star size={10} />
                  </button>
                )}
                {/* Delete */}
                <button onClick={() => handleDelete(p.path)} style={{ ...btnStyle(), color: '#e53e3e', borderColor: '#fecaca' }} title="Eliminar">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && handleUpload(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#f8fafc',
          border: '1.5px dashed #d1d5db',
          borderRadius: 8, padding: '10px 16px',
          fontSize: 13, color: '#6b7280', cursor: uploading ? 'not-allowed' : 'pointer',
          width: '100%', justifyContent: 'center',
        }}
      >
        {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo…</> : <><Upload size={14} /> Subir fotos</>}
      </button>
      {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#e53e3e' }}>{error}</p>}
      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#aaa' }}>
        La foto en posición 1 es la Principal. Usa ←→ para reordenar.
      </p>
    </div>
  )
}
