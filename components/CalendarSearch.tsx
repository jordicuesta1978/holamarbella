'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

type Props = {
  globalBlockedDates: string[]
}

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function toKey(d: Date) {
  return d.toISOString().split('T')[0]
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate()
}

function firstWeekday(y: number, m: number) {
  return (new Date(y, m, 1).getDay() + 6) % 7
}

function addMonths(y: number, m: number, n: number): [number, number] {
  const d = new Date(y, m + n, 1)
  return [d.getFullYear(), d.getMonth()]
}

function fmtShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function CalendarSearch({ globalBlockedDates }: Props) {
  const router = useRouter()
  const today = toKey(new Date())
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)

  const blockedSet = useMemo(() => new Set(globalBlockedDates), [globalBlockedDates])

  function isBlocked(key: string) {
    return key < today || blockedSet.has(key)
  }

  function handleDayClick(key: string) {
    if (isBlocked(key)) return
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(key); setCheckOut(null); return
    }
    if (key <= checkIn) { setCheckIn(key); setCheckOut(null); return }
    setCheckOut(key)
  }

  function handleSearch() {
    if (!checkIn || !checkOut) return
    router.push(`/apartamentos?checkIn=${checkIn}&checkOut=${checkOut}`)
  }

  const [nextY, nextM] = addMonths(year, month, 1)

  function renderMonth(y: number, m: number) {
    const numDays = daysInMonth(y, m)
    const startOffset = firstWeekday(y, m)
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: numDays }, (_, i) => i + 1),
    ]
    while (cells.length % 7 !== 0) cells.push(null)

    return (
      <div>
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#1a1a2e', marginBottom: 8 }}>
          {MONTHS_ES[m]} {y}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
          {DAYS_ES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#aaa', padding: '3px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} style={{ aspectRatio: '1' }} />
            const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const blocked = isBlocked(key)
            const isCheckIn = key === checkIn
            const isCheckOut = key === checkOut
            const activeHover = hover && checkIn && !checkOut && hover > checkIn ? hover : null
            const inRange = checkIn && (checkOut ?? activeHover) && key > checkIn && key < (checkOut ?? activeHover!)
            const isToday = key === today

            let bg = 'transparent'
            let color = '#1a1a2e'
            let cursor = 'pointer'
            let fontWeight = 400
            let opacity = 1

            if (blocked) { bg = 'transparent'; color = '#d1d5db'; cursor = 'not-allowed'; opacity = 0.5 }
            else if (isCheckIn || isCheckOut) { bg = '#4B766B'; color = '#fff'; fontWeight = 700 }
            else if (inRange) { bg = 'rgba(75,118,107,0.12)'; color = '#2d5c52' }
            else if (isToday) { fontWeight = 700; color = '#4B766B' }

            return (
              <div
                key={key}
                onClick={() => handleDayClick(key)}
                onMouseEnter={() => !blocked && setHover(key)}
                onMouseLeave={() => setHover(null)}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 4, fontSize: 11, fontWeight, background: bg, color, opacity, cursor,
                  userSelect: 'none', transition: 'background 0.1s',
                }}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const prevMonth = () => {
    const [y, m] = addMonths(year, month, -1)
    const now = new Date()
    if (y < now.getFullYear() || (y === now.getFullYear() && m < now.getMonth())) return
    setYear(y); setMonth(m)
  }
  const nextMonth = () => {
    const [y, m] = addMonths(year, month, 1)
    setYear(y); setMonth(m)
  }

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0

  return (
    <div style={{
      background: 'white', borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
      padding: '20px', maxWidth: 560, width: '100%', margin: '0 auto',
    }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: '#555' }}>‹</button>
        <span style={{ fontSize: 12, color: '#888' }}>Elige fechas de entrada y salida</span>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14, color: '#555' }}>›</button>
      </div>

      {/* Two months */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 16 }}>
        {renderMonth(year, month)}
        {renderMonth(nextY, nextM)}
      </div>

      {/* Summary + CTA */}
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          {checkIn && checkOut ? (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
              {fmtShort(checkIn)} → {fmtShort(checkOut)}
              {nights > 0 && <span style={{ color: '#888', fontWeight: 400 }}> · {nights} noche{nights > 1 ? 's' : ''}</span>}
            </p>
          ) : checkIn ? (
            <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Selecciona fecha de salida</p>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Selecciona fecha de entrada</p>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={!checkIn || !checkOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: (!checkIn || !checkOut) ? '#e2e8f0' : '#4B766B',
            color: (!checkIn || !checkOut) ? '#aaa' : '#fff',
            border: 'none', borderRadius: 10, padding: '11px 20px',
            fontSize: 13, fontWeight: 700, cursor: (!checkIn || !checkOut) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <Search size={15} /> Buscar apartamentos
        </button>
      </div>
    </div>
  )
}
