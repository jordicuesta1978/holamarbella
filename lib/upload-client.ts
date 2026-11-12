'use client'

import { supabase } from './supabase'
import { contentTypeFor } from './media'

/**
 * Sube un archivo DIRECTAMENTE a Supabase Storage desde el navegador
 * (con una URL firmada que genera el servidor solo para el admin).
 * Así no pasa por Vercel, que corta las subidas de más de ~4,5 MB:
 * vídeos y fotos grandes del móvil funcionan.
 */
export async function uploadToStorage(file: File, bucket: string, path: string): Promise<{ url: string; path: string }> {
  const signRes = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path }),
  })
  const sign = await signRes.json().catch(() => ({}))
  if (!signRes.ok || !sign.token) throw new Error(sign.error || 'No se pudo preparar la subida')

  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(sign.path, sign.token, file, { contentType: contentTypeFor(file), upsert: true })
  if (error) throw new Error(error.message)

  return { url: sign.publicUrl as string, path: sign.path as string }
}

/** Abre el selector de archivos del sistema y devuelve los elegidos. */
export function pickFiles(accept: string, multiple = false): Promise<File[]> {
  return new Promise(resolve => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    input.style.display = 'none'
    input.onchange = () => {
      resolve(Array.from(input.files ?? []))
      input.remove()
    }
    document.body.appendChild(input)
    input.click()
  })
}

/** Nombre de archivo único para Storage (ej. "1731370000000_k3j2.jpg"). */
export function uniqueFileName(ext: string): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
}
