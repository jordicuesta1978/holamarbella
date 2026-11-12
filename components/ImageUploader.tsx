'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadToStorage } from '@/lib/upload-client'

type Props = {
  bucket: string
  path: string
  name: string
  defaultValue?: string
  placeholder?: string
}

export default function ImageUploader({ bucket, path, name, defaultValue, placeholder }: Props) {
  const [url, setUrl] = useState(defaultValue || '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${path}/${Date.now()}.${ext}`
    try {
      const { url: publicUrl } = await uploadToStorage(file, bucket, filePath)
      setUrl(publicUrl)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir la imagen')
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {url ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <img src={url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url.split('/').pop()}</span>
          <button
            type="button"
            onClick={() => setUrl('')}
            style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={12} />
          </button>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={placeholder || 'URL de imagen o sube un archivo'}
          style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '8px 12px', fontSize: 12, color: '#6b7280', cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
          }}
        >
          {uploading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={12} />}
          {uploading ? 'Subiendo…' : 'Subir'}
        </button>
      </div>
      {error && <p style={{ margin: '4px 0 0', fontSize: 11, color: '#e53e3e' }}>{error}</p>}
    </div>
  )
}
