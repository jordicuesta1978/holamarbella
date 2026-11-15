// ── Slugs ────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'al', 'un', 'una', 'por', 'para', 'con', 'que', 'su', 'sus', 'desde',
  'the', 'of', 'and', 'in', 'to', 'from', 'a', 'an', 'for', 'on', 'at', 'with', 'its', 'your',
])

export function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Slug corto: sin palabras vacías y con un máximo de 5 palabras */
export function shortSlug(s: string, maxWords = 5) {
  const words = slugify(s).split('-').filter(Boolean)
  const kept = words.filter(w => !STOPWORDS.has(w))
  return (kept.length ? kept : words).slice(0, maxWords).join('-')
}
