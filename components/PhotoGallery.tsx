'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Star, Loader2, ChevronLeft, ChevronRight, Video } from 'lucide-react'
import { uploadToStorage } from '@/lib/upload-client'
import { isVideoPath, isVideoFile, MAX_VIDEO_MB } from '@/lib/media'

type Photo = { path: string; url: string; isPrimary: boolean }

// La posición 1 (Principal) siempre tiene que ser una FOTO: es la que sale en
// las tarjetas y en la cabecera. Si quedara un vídeo delante, se adelanta la
// primera foto. "isPrimary" se recalcula siempre a partir de la posición.
function normalize(list: Photo[]): Photo[] {
  const out = [...list]
  if (out.length > 0 && isVideoPath(out[0].path)) {
    const firstImg = out.findIndex(p => !isVideoPath(p.path))
    if (firstImg > 0) out.unshift(out.splice(firstImg, 1)[0])
  }
  return out.map((p, i) => ({ ...p, isPrimary: i === 0 && !isVideoPath(p.path) }))
}

type Props = {
  slug: string
  initialPhotos: Photo[]
  onPrimaryChange: (path: string) => Promise<void>
  /** Called with the full ordered array of paths whenever order or primary changes */
  onOrderChange?: (orderedPaths: string[]) => Promise<void>
}

export default function PhotoGallery({ slug, initialPhotos, onPrimaryChange, onOrderChange }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(() => normalize(initialPhotos))
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
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
    const list = Array.from(files)
    const errors: string[] = []

    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      const video = isVideoFile(file)
      if (video && file.size > MAX_VIDEO_MB * 1024 * 1024) {
        errors.push(`"${file.name}" pesa ${Math.round(file.size / 1024 / 1024)} MB (máximo ${MAX_VIDEO_MB} MB). Recórtalo o comprímelo antes de subirlo.`)
        continue
      }
      setProgress(`Subiendo ${i + 1} de ${list.length}${video ? ' (vídeo, puede tardar)' : ''}…`)
      const ext = file.name.split('.').pop()?.toLowerCase() || (video ? 'mp4' : 'jpg')
      const path = `${slug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      try {
        const res = await uploadToStorage(file, 'apartamentos', path)
        uploaded.push({ path: res.path, url: res.url, isPrimary: false })
      } catch (e) {
        errors.push(`"${file.name}": ${e instanceof Error ? e.message : 'error al subir'}`)
      }
    }
    if (errors.length > 0) setError(errors.join(' · '))

    if (uploaded.length > 0) {
      setPhotos(prev => {
        const updated = normalize([...prev, ...uploaded])
        saveOrder(updated)
        return updated
      })
    }
    setProgress(null)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(path: string) {
    await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket: 'apartamentos', path }),
    })
    setPhotos(prev => {
      const next = normalize(prev.filter(p => p.path !== path))
      saveOrder(next)
      return next
    })
  }

  async function handleSetPrimary(path: string) {
    setPhotos(prev => {
      // Move to front, mark as primary
      const target = prev.find(p => p.path === path)!
      const rest = prev.filter(p => p.path !== path)
      const updated = normalize([target, ...rest])
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
      // La posición 1 (Principal) siempre es una foto
      if (isVideoPath(next[0].path) && next.some(p => !isVideoPath(p.path))) return prev
      const updated = normalize(next)
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
              {isVideoPath(p.path) ? (
                <>
                  <video src={p.url} muted loop playsInline autoPlay preload="metadata" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', background: '#111' }} />
                  <span style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Video size={10} /> VÍDEO
                  </span>
                </>
              ) : (
                <img src={p.url} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              )}
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
                {!p.isPrimary && !isVideoPath(p.path) && (
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
        accept="image/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"
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
        {uploading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> {progress ?? 'Subiendo…'}</> : <><Upload size={14} /> Subir fotos o vídeos</>}
      </button>
      {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#e53e3e' }}>{error}</p>}
      <p style={{ margin: '4px 0 0', fontSize: 11, color: '#aaa' }}>
        La foto en posición 1 es la Principal (siempre una foto, no un vídeo). Usa ←→ para reordenar.
        Vídeos: MP4 o MOV, máximo {MAX_VIDEO_MB} MB. Mejor grabados en horizontal; los verticales se ven enteros con fondo difuminado.
      </p>
    </div>
  )
}
