'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CalendarDays, X } from 'lucide-react'

type Props = { globalBlockedDates: string[] }

const DAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toKey(d: Date) { return d.toISOString().split('T')[0] }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 }
function fmtShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

type Panel = 'in' | 'out' | null

export default function HeroSearch({ globalBlockedDates }: Props) {
  const router = useRouter()
  const today = toKey(new Date())
  const ref = useRef<HTMLDivElement>(null)

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [open, setOpen] = useState<Panel>(null)
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [hover, setHover] = useState<string | null>(null)

  const blockedSet = useMemo(() => new Set(globalBlockedDates), [globalBlockedDates])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function isBlocked(key: string) { return key < today || blockedSet.has(key) }

  function handleDayClick(key: string) {
    if (isBlocked(key)) return
    if (open === 'in') {
      setCheckIn(key)
      setCheckOut(null)
      setOpen('out')
    } else if (open === 'out') {
      if (!checkIn || key <= checkIn) {
        setCheckIn(key); setCheckOut(null); setOpen('out'); return
      }
      // Check no blocked days in the range
      let hasBlock = false
      const s = new Date(checkIn + 'T00:00:00')
      const e = new Date(key + 'T00:00:00')
      for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
        if (blockedSet.has(toKey(d))) { hasBlock = true; break }
      }
      if (hasBlock) {
        // Start over from this date
        setCheckIn(key); setCheckOut(null); setOpen('out'); return
      }
      setCheckOut(key)
      setOpen(null)
    }
  }

  function openPanel(panel: Panel) {
    setOpen(o => o === panel ? null : panel)
    if (panel === 'in') {
      setCalYear(new Date().getFullYear())
      setCalMonth(new Date().getMonth())
    }
  }

  function handleSearch() {
    if (!checkIn || !checkOut) { setOpen('in'); return }
    router.push(`/apartamentos?checkIn=${checkIn}&checkOut=${checkOut}`)
  }

  function clearDates() { setCheckIn(null); setCheckOut(null); setOpen(null) }

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const numDays = daysInMonth(calYear, calMonth)
  const startOffset = firstWeekday(calYear, calMonth)
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0

  const inLabel = checkIn ? fmtShort(checkIn) : 'Añade tu llegada'
  const outLabel = checkOut ? fmtShort(checkOut) : 'Añade tu salida'
  const hasSelection = !!(checkIn || checkOut)

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 580, margin: '0 auto' }}>
      {/* Pill */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: 'white', borderRadius: 60,
        boxShadow: '0 4px 28px rgba(0,0,0,0.18)',
        border: '1px solid rgba(255,255,255,0.9)',
        overflow: 'hidden', height: 58,
      }}>
        {/* Entrada */}
        <button
          onClick={() => openPanel('in')}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            justifyContent: 'center', padding: '0 20px',
            background: open === 'in' ? '#f0f9f6' : 'transparent',
            border: 'none', cursor: 'pointer', borderRight: '1px solid #e2e8f0',
            borderRadius: '60px 0 0 60px', transition: 'background 0.15s',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: '#555', marginBottom: 1 }}>Llegada</span>
          <span style={{ fontSize: 13, fontWeight: checkIn ? 700 : 400, color: checkIn ? '#1a1a2e' : '#9ca3af' }}>
            {inLabel}
          </span>
        </button>

        {/* Salida */}
        <button
          onClick={() => openPanel('out')}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            justifyContent: 'center', padding: '0 20px',
            background: open === 'out' ? '#f0f9f6' : 'transparent',
            border: 'none', cursor: 'pointer', borderRight: '1px solid #e2e8f0',
            transition: 'background 0.15s',
          }}
        >
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: '#555', marginBottom: 1 }}>Salida</span>
          <span style={{ fontSize: 13, fontWeight: checkOut ? 700 : 400, color: checkOut ? '#1a1a2e' : '#9ca3af' }}>
            {outLabel}
          </span>
        </button>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px 0 12px' }}>
          {hasSelection && (
            <button onClick={clearDates} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', padding: 4, borderRadius: '50%' }} title="Limpiar">
              <X size={14} />
            </button>
          )}
          <button
            onClick={handleSearch}
            style={{
              background: '#4B766B', color: '#fff', border: 'none',
              borderRadius: 50, width: 40, height: 40, display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              flexShrink: 0, transition: 'background 0.15s',
            }}
          >
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Nights badge */}
      {nights > 0 && !open && (
        <div style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.92)', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#4B766B', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}>
          {nights} noche{nights > 1 ? 's' : ''}
        </div>
      )}

      {/* Dropdown calendar */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)',
          left: open === 'in' ? 0 : 'auto',
          right: open === 'out' ? 0 : 'auto',
          background: 'white', borderRadius: 16,
          boxShadow: '0 8px 48px rgba(0,0,0,0.18)',
          padding: '20px', zIndex: 100, minWidth: 300,
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            {open === 'in' ? 'Fecha de llegada' : 'Fecha de salida'}
          </div>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 16, color: '#555' }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 16, color: '#555' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#aaa', padding: '3px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`e${idx}`} style={{ aspectRatio: '1' }} />
              const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const blocked = isBlocked(key)
              const isSelected = key === checkIn || key === checkOut
              const isToday = key === today

              // Range preview for salida panel
              const activeHover = open === 'out' && hover && checkIn && hover > checkIn ? hover : null
              const inRange = open === 'out' && checkIn && (checkOut ?? activeHover) && key > checkIn && key < (checkOut ?? activeHover!)

              // Disable dates before checkIn in salida panel
              const beforeMin = open === 'out' && checkIn && key <= checkIn

              let bg = 'transparent'
              let color = '#1a1a2e'
              let cursor: string = blocked || beforeMin ? 'not-allowed' : 'pointer'
              let opacity = blocked || beforeMin ? 0.35 : 1
              let fontWeight = isToday ? 700 : 400

              if (blocked || beforeMin) {
                color = '#aaa'
              } else if (isSelected) {
                bg = '#4B766B'; color = '#fff'; fontWeight = 700
              } else if (inRange) {
                bg = 'rgba(75,118,107,0.1)'; color = '#2d5c52'
              } else if (isToday) {
                color = '#4B766B'
              }

              return (
                <div
                  key={key}
                  onClick={() => !blocked && !beforeMin && handleDayClick(key)}
                  onMouseEnter={() => !blocked && !beforeMin && setHover(key)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', fontSize: 12, fontWeight, background: bg, color, opacity, cursor,
                    userSelect: 'none', transition: 'background 0.1s',
                  }}
                >
                  {day}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          {open === 'in' && checkIn && (
            <p style={{ margin: '10px 0 0', fontSize: 11, color: '#4B766B', textAlign: 'center', fontWeight: 600 }}>
              Llegada: {fmtShort(checkIn)} — Ahora elige la salida
            </p>
          )}
          {open === 'out' && !checkIn && (
            <p style={{ margin: '10px 0 0', fontSize: 11, color: '#888', textAlign: 'center' }}>
              Elige primero la fecha de llegada
            </p>
          )}
        </div>
      )}
    </div>
  )
}
