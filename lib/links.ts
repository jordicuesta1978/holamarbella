// Utilidades compartidas para enlaces creados desde el admin.

const SITE_HOSTS = ['holamarbella.casa', 'www.holamarbella.casa', 'holamarbella.vercel.app']

/** Completa la URL que escribe el admin: "www.x.com" → "https://www.x.com"; deja "/es/…", mailto: y tel: */
export function normalizeUrl(raw: string): string {
  const u = raw.trim()
  if (!u) return ''
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(u)) return u
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return `mailto:${u}`
  if (/^\+?[\d\s]{7,}$/.test(u)) return `tel:${u.replace(/\s+/g, '')}`
  return `https://${u}`
}

/** Enlace a otra web (se abre en pestaña nueva). Los internos se abren en la misma. */
export function isExternalUrl(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false
  try {
    return !SITE_HOSTS.includes(new URL(href).hostname.toLowerCase())
  } catch {
    return true
  }
}

// ── Texto plano con enlaces: [texto](url) y URLs sueltas ─────────────────────

export type RichSegment = { type: 'text'; value: string } | { type: 'link'; label: string; href: string }

const LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g

export function parseRichText(text: string): RichSegment[] {
  const out: RichSegment[] = []
  let last = 0
  for (const m of text.matchAll(LINK_RE)) {
    const i = m.index ?? 0
    if (i > last) out.push({ type: 'text', value: text.slice(last, i) })
    if (m[1]) out.push({ type: 'link', label: m[1], href: normalizeUrl(m[2]) })
    else out.push({ type: 'link', label: m[3], href: m[3] })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
}

/** Texto sin la sintaxis de enlaces (para meta descripciones, contar palabras…) */
export function plainRichText(text: string): string {
  return parseRichText(text).map(s => (s.type === 'text' ? s.value : s.label)).join('')
}

/** Recorta a N palabras sin romper los enlaces */
export function truncateRichText(segments: RichSegment[], maxWords: number): { segments: RichSegment[]; truncated: boolean } {
  const out: RichSegment[] = []
  let count = 0
  for (const seg of segments) {
    const value = seg.type === 'text' ? seg.value : seg.label
    const words = value.split(/(\s+)/)
    const n = words.filter(w => w.trim()).length
    if (count + n <= maxWords) {
      out.push(seg)
      count += n
      continue
    }
    if (seg.type === 'text') {
      let kept = ''
      for (const w of words) {
        if (w.trim()) {
          if (count >= maxWords) break
          count++
        }
        kept += w
      }
      if (kept.trim()) out.push({ type: 'text', value: kept.trimEnd() })
    }
    return { segments: out, truncated: true }
  }
  return { segments: out, truncated: false }
}
