// Utilidades compartidas (cliente y servidor) para distinguir fotos y vídeos.

export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm', 'm4v']

/** Tamaño máximo por vídeo. Supabase (plan gratuito) admite 50 MB por archivo. */
export const MAX_VIDEO_MB = 50

export function extOf(pathOrUrl: string): string {
  const clean = pathOrUrl.split('?')[0].split('#')[0]
  return clean.split('.').pop()?.toLowerCase() ?? ''
}

export function isVideoPath(pathOrUrl: string): boolean {
  return VIDEO_EXTENSIONS.includes(extOf(pathOrUrl))
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || VIDEO_EXTENSIONS.includes(extOf(file.name))
}

export function contentTypeFor(file: File): string {
  if (file.type) return file.type
  const ext = extOf(file.name)
  if (ext === 'mov') return 'video/quicktime'
  if (ext === 'webm') return 'video/webm'
  if (ext === 'mp4' || ext === 'm4v') return 'video/mp4'
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}
