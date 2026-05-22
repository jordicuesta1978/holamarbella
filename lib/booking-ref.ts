const APT_CODES: Record<string, string> = {
  paloma: 'PAL',
  larysol: 'LAR',
  micu: 'MIC',
  ami: 'AMI',
  banesto: 'BAN',
}

export function getBookingRef(id: number, slug: string, createdAt: string): string {
  const d = new Date(createdAt)
  const date = d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }).replace(/-/g, '')
  const code = APT_CODES[slug] ?? slug.slice(0, 3).toUpperCase()
  const counter = String(id % 99 + 1).padStart(2, '0')
  return `${date}${code}${counter}`
}
