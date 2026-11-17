import Link from 'next/link'
import AdminNavServer from '@/app/admin/AdminNavServer'
import DashboardRefresh from '@/app/admin/DashboardRefresh'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTotals, getBreakdown, hasAnalyticsToken, type Row, type Totals } from '@/lib/vercel-analytics'
import { Users, Eye, CalendarCheck, Percent, ChartColumnIncreasing } from 'lucide-react'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

const GREEN = '#4B766B'
const PERIODOS = [
  { key: 'hoy', label: 'Hoy', dias: 0 },
  { key: '7', label: '7 días', dias: 7 },
  { key: '30', label: '30 días', dias: 30 },
  { key: '90', label: '90 días', dias: 90 },
] as const

// Medianoche de hoy en hora de Madrid (respeta horario de verano/invierno)
function inicioDeHoyMadrid(): Date {
  const now = new Date()
  const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(now) // YYYY-MM-DD
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', timeZoneName: 'longOffset' })
    .formatToParts(now).find(p => p.type === 'timeZoneName')?.value.replace('GMT', '') || '+01:00'
  return new Date(`${fecha}T00:00:00${offset || '+00:00'}`)
}

const nombrePais = (() => {
  try {
    const dn = new Intl.DisplayNames(['es'], { type: 'region' })
    return (code: string) => { try { return dn.of(code) || code } catch { return code } }
  } catch {
    return (code: string) => code
  }
})()

function nombreProcedencia(host: string | undefined): string {
  if (!host) return 'Directo / WhatsApp / email'
  const h = host.toLowerCase().replace(/^www\./, '')
  if (h.includes('google.')) return 'Google'
  if (h.includes('instagram')) return 'Instagram'
  if (h.includes('facebook') || h === 'fb.com' || h === 'm.facebook.com') return 'Facebook'
  if (h.includes('whatsapp') || h === 'wa.me') return 'WhatsApp'
  if (h.includes('airbnb')) return 'Airbnb'
  if (h.includes('bing.')) return 'Bing'
  if (h.includes('holamarbella')) return 'HolaMarbella (interno)'
  return h
}

const DISPOSITIVOS: Record<string, string> = { mobile: 'Móvil', desktop: 'Ordenador', tablet: 'Tablet' }

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
}

function agrupar(rows: Row[], clave: (r: Row) => string | null) {
  const map = new Map<string, Totals>()
  for (const r of rows) {
    const k = clave(r)
    if (!k) continue
    const prev = map.get(k) || { pageviews: 0, visitors: 0 }
    map.set(k, { pageviews: prev.pageviews + (r.pageviews || 0), visitors: prev.visitors + (r.visitors || 0) })
  }
  return [...map.entries()].map(([label, t]) => ({ label, ...t })).sort((a, b) => b.pageviews - a.pageviews)
}

async function contarSolicitudes(since: Date): Promise<number | null> {
  try {
    const { count, error } = await db.from('reservas').select('id', { count: 'exact', head: true }).gte('created_at', since.toISOString())
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

export default async function EstadisticasPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo: periodoParam } = await searchParams
  const periodo = PERIODOS.find(p => p.key === periodoParam) ?? PERIODOS[1]
  const until = new Date()
  const since = periodo.dias === 0 ? inicioDeHoyMadrid() : new Date(until.getTime() - periodo.dias * 86400000)

  if (!hasAnalyticsToken()) {
    return (
      <Shell periodoKey={periodo.key}>
        <Card>
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Falta conectar con Vercel</h2>
          <p style={{ margin: 0, fontSize: 14, color: '#555', lineHeight: 1.6 }}>
            Crea un token en vercel.com → Account Settings → Tokens y añádelo en el proyecto como variable de entorno
            <code style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, margin: '0 4px' }}>VERCEL_TOKEN</code>
            (Settings → Environment Variables). Después vuelve a desplegar.
          </p>
        </Card>
      </Shell>
    )
  }

  const granularidad = periodo.dias === 0 ? 'hour' : 'day'
  const [totalsR, serieR, rutasR, procR, paisesR, dispR, solicitudes] = await Promise.all([
    getTotals(since, until).then(ok, ko),
    getBreakdown(granularidad, since, until, 100).then(ok, ko),
    getBreakdown('requestPath', since, until, 100).then(ok, ko),
    getBreakdown('referrerHostname', since, until, 10).then(ok, ko),
    getBreakdown('country', since, until, 10).then(ok, ko),
    getBreakdown('deviceType', since, until, 5).then(ok, ko),
    contarSolicitudes(since),
  ])

  const primerError = [totalsR, serieR, rutasR, procR, paisesR, dispR].find(r => !r.ok) as { ok: false; error: string } | undefined
  const totals = totalsR.ok ? (totalsR.value as Totals) : null
  const serie = serieR.ok ? (serieR.value as Row[]) : []
  const rutas = rutasR.ok ? (rutasR.value as Row[]) : []

  const apartamentos = agrupar(rutas, r => {
    const m = String(r.requestPath ?? '').match(/^\/(?:es|en)\/apartamentos\/([^/?#]+)/)
    return m ? capitalizar(decodeURIComponent(m[1])) : null
  })
  const paginas = agrupar(rutas, r => String(r.requestPath ?? '') || null).slice(0, 10)
  const idiomas = agrupar(rutas, r => {
    const p = String(r.requestPath ?? '')
    if (p.startsWith('/es')) return 'Español'
    if (p.startsWith('/en')) return 'Inglés'
    return null
  })
  const procedencia = procR.ok ? agrupar(procR.value as Row[], r => nombreProcedencia(r.referrerHostname as string | undefined)) : []
  const paises = paisesR.ok ? agrupar(paisesR.value as Row[], r => (r.country ? nombrePais(String(r.country)) : 'Desconocido')) : []
  const dispositivos = dispR.ok ? agrupar(dispR.value as Row[], r => DISPOSITIVOS[String(r.deviceType)] || capitalizar(String(r.deviceType || 'Otro'))) : []

  const conversion = totals && totals.visitors > 0 && solicitudes !== null ? (solicitudes / totals.visitors) * 100 : null

  return (
    <Shell periodoKey={periodo.key}>
      <DashboardRefresh />

      {primerError && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          No se han podido cargar todos los datos de Vercel ({primerError.error}).
          {periodo.dias > 30 && ' Es posible que tu plan de Vercel no guarde datos de tanto tiempo; prueba con 30 días.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        <Kpi icon={<Users size={16} />} label="Visitantes" value={totals ? fmt(totals.visitors) : '—'} />
        <Kpi icon={<Eye size={16} />} label="Páginas vistas" value={totals ? fmt(totals.pageviews) : '—'} />
        <Kpi icon={<CalendarCheck size={16} />} label="Solicitudes de reserva" value={solicitudes === null ? '—' : fmt(solicitudes)} />
        <Kpi icon={<Percent size={16} />} label="Conversión" value={conversion === null ? '—' : `${conversion.toFixed(1)} %`} hint="solicitudes / visitantes" />
      </div>

      <Card title={periodo.dias === 0 ? 'Visitas por hora' : 'Visitas por día'}>
        <Grafico serie={serie} porHora={periodo.dias === 0} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
        <Card title="Apartamentos más vistos"><Barras items={apartamentos} vacio="Aún no hay visitas a fichas de apartamentos" /></Card>
        <Card title="De dónde llegan"><Barras items={procedencia} /></Card>
        <Card title="Páginas más vistas"><Barras items={paginas} mono /></Card>
        <Card title="Países"><Barras items={paises} /></Card>
        <Card title="Dispositivo"><Barras items={dispositivos} /></Card>
        <Card title="Idioma de la web"><Barras items={idiomas} /></Card>
      </div>

      <p style={{ fontSize: 12, color: '#999', marginTop: 20, textAlign: 'center' }}>
        Datos de Vercel Web Analytics (solo producción). Se actualiza automáticamente cada 30 segundos. Las visitas al panel de admin no cuentan.
      </p>
    </Shell>
  )
}

/* ───────── helpers de resultado ───────── */
function ok<T>(value: T) { return { ok: true as const, value } }
function ko(e: unknown) { return { ok: false as const, error: e instanceof Error ? e.message : String(e) } }
function fmt(n: number) { return n.toLocaleString('es-ES') }

/* ───────── componentes de presentación ───────── */
function Shell({ children, periodoKey }: { children: React.ReactNode; periodoKey: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChartColumnIncreasing size={20} color={GREEN} /> Estadísticas de la web
          </h1>
          <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 3 }}>
            {PERIODOS.map(p => (
              <Link key={p.key} href={`/admin/estadisticas?periodo=${p.key}`}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, textDecoration: 'none',
                  fontWeight: p.key === periodoKey ? 700 : 500,
                  color: p.key === periodoKey ? '#fff' : '#555',
                  background: p.key === periodoKey ? GREEN : 'transparent',
                }}>
                {p.label}
              </Link>
            ))}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
      {title && <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{title}</h2>}
      {children}
    </div>
  )
}

function Kpi({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: 12, fontWeight: 600 }}>
        <span style={{ color: GREEN, display: 'flex' }}>{icon}</span>{label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', marginTop: 6 }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: '#aaa' }}>{hint}</div>}
    </div>
  )
}

function Barras({ items, vacio = 'Sin datos todavía', mono }: { items: { label: string; pageviews: number; visitors: number }[]; vacio?: string; mono?: boolean }) {
  if (items.length === 0) return <p style={{ margin: 0, fontSize: 13, color: '#bbb' }}>{vacio}</p>
  const max = Math.max(...items.map(i => i.visitors), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(i => (
        <div key={i.label} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', background: '#f8fafc' }}>
          <div style={{ position: 'absolute', inset: 0, width: `${(i.visitors / max) * 100}%`, background: '#e3efeb' }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 10px', fontSize: 13 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? 12 : 13 }}>{i.label}</span>
            <span style={{ fontWeight: 700, color: GREEN, whiteSpace: 'nowrap' }} title={`${fmt(i.pageviews)} páginas vistas`}>{fmt(i.visitors)}</span>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right' }}>visitantes</div>
    </div>
  )
}

function Grafico({ serie, porHora }: { serie: Row[]; porHora: boolean }) {
  if (serie.length === 0) return <p style={{ margin: 0, fontSize: 13, color: '#bbb' }}>Sin datos todavía</p>
  const max = Math.max(...serie.map(s => s.pageviews || 0), 1)
  const fmtX = (ts: string) => {
    const d = new Date(ts)
    return porHora
      ? d.toLocaleTimeString('es-ES', { hour: '2-digit', timeZone: 'Europe/Madrid' }) + 'h'
      : d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' })
  }
  const step = Math.ceil(serie.length / 8)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 160 }}>
        {serie.map((s, idx) => (
          <div key={idx} title={`${fmtX(String(s.timestamp))}: ${fmt(s.visitors || 0)} visitantes · ${fmt(s.pageviews || 0)} páginas`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div style={{ height: `${((s.pageviews || 0) / max) * 100}%`, minHeight: s.pageviews ? 2 : 0, background: '#cfe3dc', borderRadius: '3px 3px 0 0', position: 'relative' }}>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${s.pageviews ? ((s.visitors || 0) / s.pageviews) * 100 : 0}%`, background: GREEN, borderRadius: '3px 3px 0 0' }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
        {serie.map((s, idx) => (
          <div key={idx} style={{ flex: 1, fontSize: 10, color: '#999', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'visible' }}>
            {idx % step === 0 ? fmtX(String(s.timestamp)) : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#888', marginTop: 10 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: GREEN, borderRadius: 2, marginRight: 4 }} />Visitantes</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#cfe3dc', borderRadius: 2, marginRight: 4 }} />Páginas vistas</span>
      </div>
    </div>
  )
}
