'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Star, Loader2 } from 'lucide-react'

type Photo = { path: string; url: string; isPrimary: boolean }

type Props = {
  slug: string
  initialPhotos: Photo[]
  onPrimaryChange: (path: string) => Promise<void>
}

export default function PhotoGallery({ slug, initialPhotos, onPrimaryChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
        // If no photos existed, mark first upload as primary
        const noneIsPrimary = prev.every(p => !p.isPrimary)
        return [...prev, ...uploaded.map((p, i) => ({ ...p, isPrimary: noneIsPrimary && i === 0 && prev.length === 0 }))]
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
      const next = prev.filter(p => p.path !== path)
      // If we deleted the primary, assign first remaining
      if (prev.find(p => p.path === path)?.isPrimary && next.length > 0) {
        next[0].isPrimary = true
        onPrimaryChange(next[0].path).catch(() => {})
      }
      return next
    })
  }

  async function handleSetPrimary(path: string) {
    setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.path === path })))
    await onPrimaryChange(path)
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

  return (
    <div>
      {/* Grid */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
          {photos.map(p => (
            <div key={p.path} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: p.isPrimary ? '2px solid #4B766B' : '1px solid #e2e8f0', background: '#f8fafc' }}>
              <img src={p.url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              {p.isPrimary && (
                <span style={{ position: 'absolute', top: 4, left: 4, background: '#4B766B', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  PRINCIPAL
                </span>
              )}
              <div style={{ display: 'flex', gap: 4, padding: 6, background: 'rgba(255,255,255,0.95)' }}>
                {!p.isPrimary && (
                  <button onClick={() => handleSetPrimary(p.path)} style={btnStyle()} title="Marcar como principal">
                    <Star size={10} />
                  </button>
                )}
                <button onClick={() => handleDelete(p.path)} style={{ ...btnStyle(), color: '#e53e3e', borderColor: '#fecaca' }} title="Eliminar">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
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
          background: uploading ? '#f8fafc' : '#f8fafc',
          border: '1.5px dashed #d1d5db',
          borderRadius: 8, padding: '10px 16px',
          fontSize: 13, color: '#6b7280', cursor: uploading ? 'not-allowed' : 'pointer',
          width: '100%', justifyContent: 'center',
        }}
      >
        {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo…</> : <><Upload size={14} /> Subir fotos</>}
      </button>
      {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#e53e3e' }}>{error}</p>}
      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#aaa' }}>Formatos: JPG, PNG, WebP. La foto marcada como "Principal" aparece en las cards.</p>
    </div>
  )
}
