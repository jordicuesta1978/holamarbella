import { getBloqueos, addBloqueo, deleteBloqueo, getPrecios } from '../actions'
import CalendarGrid, { type DayMark } from '@/components/CalendarGrid'
import { supabaseAdmin } from '@/lib/supabase-admin'

/* eslint-disable @typescript-eslint/no-explicit-any */

const APTS = [
  { slug: 'paloma', label: 'Paloma' },
  { slug: 'micu', label: 'Micu' },
  { slug: 'larysol', label: 'Larysol' },
  { slug: 'ami', label: 'AMI' },
  { slug: 'banesto', label: 'Banesto' },
]

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function expandRanges(
  bloqueos: { apartment_slug: string; fecha_inicio: string; fecha_fin: string; motivo: string }[],
  reservas: { apartment_slug: string; check_in: string; check_out: string; guest_name: string }[],
  precios: { apartment_slug: string; fecha_inicio: string; fecha_fin: string; precio_noche: number }[],
) {
  const marks: Record<string, DayMark> = {}

  // Precios (lightest layer, shown as label)
  for (const p of precios) {
    const start = new Date(p.fecha_inicio + 'T00:00:00')
    const end = new Date(p.fecha_fin + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      if (!marks[key]) {
        marks[key] = { bg: '#f0f9f6', color: '#4B766B', label: `${p.precio_noche}€/n` }
      }
    }
  }

  // Bloqueos manuales (medium priority, gray)
  for (const b of bloqueos) {
    const start = new Date(b.fecha_inicio + 'T00:00:00')
    const end = new Date(b.fecha_fin + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      marks[key] = { bg: '#e5e7eb', color: '#6b7280', label: b.motivo || 'Bloqueado' }
    }
  }

  // Reservas confirmadas (highest priority, green with guest name)
  for (const r of reservas) {
    const start = new Date(r.check_in + 'T00:00:00')
    const end = new Date(r.check_out + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      marks[key] = { bg: '#d1fae5', color: '#065f46', label: r.guest_name }
    }
  }

  return marks
}

export default async function DisponibilidadPage() {
  const db = supabaseAdmin as any

  const [bloqueos, precios] = await Promise.all([
    getBloqueos().catch(() => []),
    getPrecios().catch(() => []),
  ])

  // Fetch confirmed reservations for the next 6 months
  const today = new Date().toISOString().split('T')[0]
  const sixMonths = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  const { data: reservasData } = await db
    .from('reservas')
    .select('apartment_slug, check_in, check_out, guest_name')
    .eq('status', 'confirmed')
    .gte('check_out', today)
    .lte('check_in', sixMonths)
  const reservas = reservasData ?? []

  const markedDates = expandRanges(bloqueos, reservas, precios)

  const now = new Date()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Calendario de disponibilidad</h2>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <CalendarGrid
            markedDates={markedDates}
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth()}
            legend={[
              { bg: '#d1fae5', label: 'Reserva confirmada' },
              { bg: '#e5e7eb', label: 'Bloqueado manualmente' },
              { bg: '#f0f9f6', label: 'Precio configurado' },
              { bg: '#f8fafc', label: 'Libre' },
            ]}
          />
        </div>
      </div>

      {/* Confirmed reservations list */}
      {reservas.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Reservas confirmadas próximas ({reservas.length})</h2>
          </div>
          {reservas.map((r: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < reservas.length - 1 ? '1px solid #f5f5f5' : undefined }}>
              <span style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#065f46', background: '#d1fae5', borderRadius: 6, padding: '3px 8px', textAlign: 'center', flexShrink: 0 }}>
                {APTS.find(a => a.slug === r.apartment_slug)?.label ?? r.apartment_slug}
              </span>
              <span style={{ fontSize: 13, color: '#1a1a2e', flex: 1 }}>
                <strong>{r.guest_name}</strong>
                <span style={{ color: '#888', marginLeft: 8 }}>· {fmt(r.check_in)} → {fmt(r.check_out)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add block */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Bloquear fechas</h2>
        </div>
        <form action={async (fd: FormData) => {
          'use server'
          const slug = fd.get('slug') as string
          const desde = fd.get('desde') as string
          const hasta = fd.get('hasta') as string
          const motivo = (fd.get('motivo') as string) || ''
          if (slug && desde && hasta && desde < hasta) await addBloqueo(slug, desde, hasta, motivo)
        }} style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Apartamento</label>
            <select name="slug" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }}>
              {APTS.map(a => <option key={a.slug} value={a.slug}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Desde</label>
            <input type="date" name="desde" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Hasta (excl.)</label>
            <input type="date" name="hasta" required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Motivo (opcional)</label>
            <input type="text" name="motivo" placeholder="Mantenimiento, reserva propia..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Bloquear
          </button>
        </form>
      </div>

      {/* Current blocks */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Bloqueos activos ({bloqueos.length})</h2>
        </div>
        {bloqueos.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay bloqueos activos</p>
        ) : bloqueos.map((b: { id: number; apartment_slug: string; fecha_inicio: string; fecha_fin: string; motivo: string }, i: number) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < bloqueos.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ width: 70, fontSize: 12, fontWeight: 700, color: '#4B766B', background: '#f0f9f6', borderRadius: 6, padding: '3px 8px', textAlign: 'center', flexShrink: 0 }}>
              {APTS.find(a => a.slug === b.apartment_slug)?.label ?? b.apartment_slug}
            </span>
            <span style={{ fontSize: 13, color: '#1a1a2e', flex: 1 }}>
              {fmt(b.fecha_inicio)} → {fmt(b.fecha_fin)}
              {b.motivo && <span style={{ color: '#888', marginLeft: 8 }}>· {b.motivo}</span>}
            </span>
            <form action={async () => {
              'use server'
              await deleteBloqueo(b.id)
            }}>
              <button type="submit" style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Desbloquear
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
