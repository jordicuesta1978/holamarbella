// Consulta la API de Vercel Web Analytics desde el servidor (nunca desde el navegador).
// Requiere la variable de entorno VERCEL_TOKEN (token de vercel.com → Account Settings → Tokens).
// projectId / teamId salen de .vercel/project.json y se pueden sobrescribir con env vars.

const API = 'https://api.vercel.com/v1/query/web-analytics'
const PROJECT_ID = process.env.VERCEL_ANALYTICS_PROJECT_ID || 'prj_aPVo35SbVUiSya3ieqACJfYBC8ON'
const TEAM_ID = process.env.VERCEL_ANALYTICS_TEAM_ID || 'team_vG7fwESwjP56GJHZrpKwhihe'

export type Totals = { pageviews: number; visitors: number }
export type Row = Totals & Record<string, string | number | undefined>

export class AnalyticsError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
  }
}

export function hasAnalyticsToken() {
  return Boolean(process.env.VERCEL_TOKEN)
}

async function query<T>(endpoint: 'visits/count' | 'visits/aggregate', params: Record<string, string>): Promise<T> {
  const token = process.env.VERCEL_TOKEN
  if (!token) throw new AnalyticsError('Falta la variable de entorno VERCEL_TOKEN')

  const qs = new URLSearchParams({ projectId: PROJECT_ID, teamId: TEAM_ID, ...params })
  const res = await fetch(`${API}/${endpoint}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error?.message || body?.message || ''
    } catch {}
    throw new AnalyticsError(`Vercel respondió ${res.status}${detail ? `: ${detail}` : ''}`, res.status)
  }
  const json = await res.json()
  return json.data as T
}

export function getTotals(since: Date, until: Date) {
  return query<Totals>('visits/count', { since: since.toISOString(), until: until.toISOString() })
}

export function getBreakdown(by: string, since: Date, until: Date, limit = 10) {
  return query<Row[]>('visits/aggregate', {
    by,
    since: since.toISOString(),
    until: until.toISOString(),
    limit: String(limit),
  })
}
