import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any

const APTS = [
  { slug: 'paloma', label: 'Paloma' },
  { slug: 'micu', label: 'Micu' },
  { slug: 'larysol', label: 'Larysol' },
  { slug: 'ami', label: 'AMI' },
  { slug: 'banesto', label: 'Banesto' },
]

type CellInfo = {
  reservaId: number
  guestName: string
  status: 'pending' | 'confirmed'
  isFirst: boolean
  isLast: boolean
}

type CalLookup = Record<string, Record<number, CellInfo | null>>

async function getCalendarData(year: number, month: number) {
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const daysInMonth = new Date(year, month, 0).getDate()
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`

  const { data: reservas } = await db
    .from('reservas')
    .select('id, guest_name, apartment_slug, check_in, check_out, status')
    .in('status', ['pending', 'confirmed'])
    .lte('check_in', lastDay)
    .gt('check_out', firstDay)

  // Build lookup: { [slug]: { [day]: CellInfo } }
  const lookup: CalLookup = {}
  for (const apt of APTS) lookup[apt.slug] = {}

  for (const r of (reservas ?? [])) {
    const ci = new Date(r.check_in + 'T00:00:00')
    const co = new Date(r.check_out + 'T00:00:00')

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month - 1, d)
      // Reservation covers this day if check_in <= cellDate < check_out
      if (cellDate >= ci && cellDate < co) {
        const nextDate = new Date(year, month - 1, d + 1)
        const isFirst = cellDate.getTime() === ci.getTime() || d === 1
        const isLast = nextDate >= co || d === daysInMonth
        lookup[r.apartment_slug] = lookup[r.apartment_slug] ?? {}
        lookup[r.apartment_slug][d] = {
          reservaId: r.id,
          guestName: r.guest_name,
          status: r.status,
          isFirst,
          isLast,
        }
      }
    }
  }

  return { lookup, daysInMonth }
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['L','M','X','J','V','S','D']

function prevMonthStr(year: number, month: number) {
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}
function nextMonthStr(year: number, month: number) {
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const now = new Date()
  const [year, month] = monthParam
    ? monthParam.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  const { lookup, daysInMonth } = await getCalendarData(year, month)

  // Day of week for first day (0=Sun → shift to Mon-based)
  const firstDow = new Date(year, month - 1, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const today = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : null

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Calendario</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href={`/admin/calendario?month=${prevMonthStr(year, month)}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none', color: '#555' }}>
              <ChevronLeft size={16} />
            </Link>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', minWidth: 160, textAlign: 'center' }}>
              {MONTH_NAMES[month - 1]} {year}
            </span>
            <Link href={`/admin/calendario?month=${nextMonthStr(year, month)}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none', color: '#555' }}>
              <ChevronRight size={16} />
            </Link>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginLeft: 'auto', fontSize: 11, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#4B766B', display: 'inline-block' }} /> Confirmada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#d97706', display: 'inline-block' }} /> Pendiente
            </span>
          </div>
        </div>

        {/* Calendar table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888', borderBottom: '1px solid #e2e8f0', minWidth: 80, position: 'sticky', left: 0, background: '#f8fafc', zIndex: 1 }}>
                  Apt
                </th>
                {days.map(d => (
                  <th key={d} style={{
                    padding: '8px 2px', textAlign: 'center',
                    fontSize: 11, fontWeight: today === d ? 800 : 600,
                    color: today === d ? '#4B766B' : '#888',
                    borderBottom: '1px solid #e2e8f0',
                    minWidth: 32, width: 32,
                    background: today === d ? '#f0f9f6' : '#f8fafc',
                  }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {APTS.map((apt, aptIdx) => (
                <tr key={apt.slug} style={{ borderBottom: aptIdx < APTS.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                  <td style={{
                    padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#555',
                    whiteSpace: 'nowrap', position: 'sticky', left: 0,
                    background: '#fff', zIndex: 1, borderRight: '1px solid #f0f0f0',
                  }}>
                    {apt.label}
                  </td>
                  {days.map(d => {
                    const cell = lookup[apt.slug]?.[d]
                    const prevCell = lookup[apt.slug]?.[d - 1]
                    const sameAsPrev = prevCell && cell && prevCell.reservaId === cell.reservaId

                    if (!cell) {
                      return (
                        <td key={d} style={{
                          padding: 0, height: 36,
                          background: today === d ? '#fafff9' : 'transparent',
                          borderLeft: today === d ? '1px solid #e8f4f0' : undefined,
                        }} />
                      )
                    }

                    const isConfirmed = cell.status === 'confirmed'
                    const bg = isConfirmed ? '#4B766B' : '#d97706'
                    const bgLight = isConfirmed ? '#e6f2ef' : '#fef3c7'

                    return (
                      <td key={d} style={{
                        padding: 0, height: 36, position: 'relative',
                        background: bgLight,
                        borderLeft: cell.isFirst ? `2px solid ${bg}` : undefined,
                        borderRight: cell.isLast ? `2px solid ${bg}` : undefined,
                        borderTop: `1px solid ${isConfirmed ? '#b2d4cc' : '#f59e0b'}`,
                        borderBottom: `1px solid ${isConfirmed ? '#b2d4cc' : '#f59e0b'}`,
                      }}>
                        {cell.isFirst && (
                          <Link href={`/admin/reservas/${cell.reservaId}`} title={cell.guestName} style={{
                            display: 'block', padding: '0 6px', lineHeight: '34px',
                            fontSize: 10, fontWeight: 700, color: bg,
                            textDecoration: 'none', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            maxWidth: 120,
                          }}>
                            {cell.guestName.split(' ')[0]}
                          </Link>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Today quick-link */}
        {!today && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link href="/admin/calendario" style={{ fontSize: 12, color: '#4B766B', fontWeight: 600, textDecoration: 'none' }}>
              Ir al mes actual →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
