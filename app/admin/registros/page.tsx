import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from '@/app/admin/AdminNavServer'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic'

const APT_NAMES: Record<string, string> = {
  paloma: 'Paloma', micu: 'Micu', larysol: 'Larysol', ami: 'AMI', banesto: 'Banesto',
}

async function getRegistros(): Promise<any[]> {
  const { data } = await (supabaseAdmin as any)
    .from('registros_viajeros')
    .select('id, nombre, apellidos, tipo_documento, numero_documento, fecha_nacimiento, created_at, apartment_slug')
    .order('created_at', { ascending: false })
  return (data ?? []) as any[]
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function RegistrosPage() {
  const registros = await getRegistros()

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Registros de viajeros</h1>
          <span style={{ fontSize: 13, color: '#888' }}>{registros.length} registro{registros.length === 1 ? '' : 's'}</span>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Nombre', 'Apellidos', 'Documento', 'Fecha nacimiento', 'Apartamento', 'Fecha registro'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.map((r: any, i: number) => (
                  <tr key={r.id} style={{ borderBottom: i < registros.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                    <td style={{ padding: '10px 12px', color: '#1a1a2e', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.nombre}</td>
                    <td style={{ padding: '10px 12px', color: '#1a1a2e', whiteSpace: 'nowrap' }}>{r.apellidos}</td>
                    <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#4B766B' }}>{r.tipo_documento}</span>{' '}
                      <span style={{ fontFamily: 'monospace' }}>{r.numero_documento}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>{fmtDate(r.fecha_nacimiento)}</td>
                    <td style={{ padding: '10px 12px', color: '#555', whiteSpace: 'nowrap' }}>{r.apartment_slug ? (APT_NAMES[r.apartment_slug] ?? r.apartment_slug) : '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#888', whiteSpace: 'nowrap' }}>{fmtDateTime(r.created_at)}</td>
                  </tr>
                ))}
                {registros.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Aún no hay registros de viajeros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
