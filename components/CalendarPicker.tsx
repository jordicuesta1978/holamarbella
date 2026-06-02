'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type BlockedRange = { start: string; end: string }
type PriceRange = { start: string; end: string; price: number }
type MinNightsRange = { start: string; end: string; min_nights: number }

type Props = {
  slug: string
  blockedRanges: BlockedRange[]
  priceMin: number
  priceMax: number
  cleaningFee: number
  minNightsDefault?: number
  minNightsRanges?: MinNightsRange[]
  priceRanges?: PriceRange[]
}

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function toKey(d: Date) { return d.toISOString().split('T')[0] }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstWeekday(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7 }
function addMonths(y: number, m: number, n: number): [number, number] {
  const d = new Date(y, m + n, 1)
  return [d.getFullYear(), d.getMonth()]
}

export default function CalendarPicker({
  slug, blockedRanges, priceMin, priceMax, cleaningFee,
  minNightsDefault = 1, minNightsRanges = [], priceRanges = [],
}: Props) {
  const today = toKey(new Date())
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [rangeError, setRangeError] = useState<string | null>(null)

  // Build blocked set (check-in to check-out exclusive, so checkout day is ok)
  const blockedSet = useMemo(() => {
    const set = new Set<string>()
    for (const { start, end } of blockedRanges) {
      const s = new Date(start + 'T00:00:00')
      const e = new Date(end + 'T00:00:00')
      for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) set.add(toKey(d))
    }
    return set
  }, [blockedRanges])

  // First blocked date after checkIn (to limit hover/range)
  const firstBlockAfterCheckIn = useMemo(() => {
    if (!checkIn || checkOut) return null
    const start = new Date(checkIn + 'T00:00:00')
    start.setDate(start.getDate() + 1) // start searching from day after checkIn
    const limit = new Date(start)
    limit.setFullYear(limit.getFullYear() + 1)
    for (const d = new Date(start); d < limit; d.setDate(d.getDate() + 1)) {
      const k = toKey(d)
      if (blockedSet.has(k)) return k
    }
    return null
  }, [checkIn, checkOut, blockedSet])

  function isBlocked(key: string) { return key < today || blockedSet.has(key) }

  // Check if range [from, to) has a blocked day (exclusive of to = checkout day)
  function rangeHasBlock(from: string, to: string) {
    const s = new Date(from + 'T00:00:00')
    const e = new Date(to + 'T00:00:00')
    for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
      if (blockedSet.has(toKey(d))) return true
    }
    return false
  }

  function handleDayClick(key: string) {
    if (isBlocked(key)) return
    setRangeError(null)

    // No checkIn yet, or resetting
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(key); setCheckOut(null); return
    }

    // Clicking before or on checkIn → reset checkIn to this date
    if (key <= checkIn) {
      setCheckIn(key); setCheckOut(null); return
    }

    // Checkout must be after checkIn (guaranteed above)
    // Check if range [checkIn, key) has blocked days
    if (rangeHasBlock(checkIn, key)) {
      setRangeError('Hay días no disponibles en ese rango. Elige otra fecha de salida.')
      setCheckOut(null)
      return
    }

    setCheckOut(key)
  }

  // Price calculation for selected range using priceRanges
  const midPrice = Math.round((priceMin + priceMax) / 2)

  const { total, nightlyBreakdown } = useMemo(() => {
    if (!checkIn || !checkOut) return { total: 0, nightlyBreakdown: [] }
    const nights: Array<{ date: string; price: number }> = []
    const s = new Date(checkIn + 'T00:00:00')
    const e = new Date(checkOut + 'T00:00:00')
    for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
      const key = toKey(d)
      // Find applicable price range
      const range = priceRanges.find(p => key >= p.start && key < p.end)
      nights.push({ date: key, price: range?.price ?? midPrice })
    }
    const base = nights.reduce((s, n) => s + n.price, 0)
    return { total: base + cleaningFee, nightlyBreakdown: nights }
  }, [checkIn, checkOut, priceRanges, midPrice, cleaningFee])

  // Minimum nights calculation
  const requiredMinNights = useMemo(() => {
    if (!checkIn) return minNightsDefault
    // Find applicable min nights range
    const range = minNightsRanges.find(r => checkIn >= r.start && checkIn < r.end)
    return range?.min_nights ?? minNightsDefault
  }, [checkIn, minNightsDefault, minNightsRanges])

  const nights = checkIn && checkOut
    ? Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
    : 0
  const minNightsWarning = nights > 0 && nights < requiredMinNights

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
        <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14, color: '#1a1a2e', marginBottom: 10 }}>
          {MONTHS_ES[m]} {y}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
          {DAYS_ES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#aaa', padding: '4px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e${idx}`} />
            const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const blocked = isBlocked(key)
            const isCheckIn = key === checkIn
            const isCheckOut = key === checkOut
            const isToday = key === today

            // Hover end: capped at first blocked date after checkIn
            const hoverEnd = firstBlockAfterCheckIn && hover && hover >= firstBlockAfterCheckIn
              ? firstBlockAfterCheckIn
              : hover
            const activeHover = hoverEnd && checkIn && !checkOut && hoverEnd > checkIn ? hoverEnd : null
            const inRange = checkIn && (checkOut ?? activeHover) && key > checkIn && key < (checkOut ?? activeHover!)

            // Days beyond first block are "out of reach" while selecting checkout
            const beyondBlock = !checkOut && checkIn && firstBlockAfterCheckIn && key >= firstBlockAfterCheckIn && key !== checkIn

            let bg = '#fff'
            let color = '#1a1a2e'
            let border = '1px solid #e2e8f0'
            let opacity = 1
            let cursor = 'pointer'

            if (blocked || beyondBlock) {
              bg = '#f3f4f6'; color = blocked ? '#d1d5db' : '#c0c4cb'
              cursor = 'not-allowed'
              if (beyondBlock) opacity = 0.4
              else opacity = 0.6
            } else if (isCheckIn || isCheckOut) {
              bg = '#4B766B'; color = '#fff'; border = '2px solid #4B766B'
            } else if (inRange) {
              bg = '#d1fae5'; color = '#065f46'; border = '1px solid #a7f3d0'
            } else if (isToday) {
              border = '2px solid #4B766B'; color = '#4B766B'
            }

            return (
              <div
                key={key}
                onClick={() => handleDayClick(key)}
                onMouseEnter={() => !blocked && setHover(key)}
                onMouseLeave={() => setHover(null)}
                style={{
                  aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, fontSize: 12, fontWeight: (isCheckIn || isCheckOut) ? 700 : 400,
                  background: bg, color, border, opacity, cursor, transition: 'background 0.1s',
                  userSelect: 'none',
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

  const [nextY, nextM] = addMonths(year, month, 1)

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  // Detect if priceRanges have variation (to show breakdown)
  const allSamePrice = nightlyBreakdown.length > 0 && nightlyBreakdown.every(n => n.price === nightlyBreakdown[0].price)

  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--outline-variant, #e2e8f0)', padding: '20px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>Selecciona fechas</h3>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>‹</button>
        <span />
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {renderMonth(year, month)}
        {renderMonth(nextY, nextM)}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#4B766B' }} /> Seleccionado
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#d1fae5', border: '1px solid #a7f3d0' }} /> Tu estancia
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: '#f3f4f6' }} /> No disponible
        </div>
      </div>

      {/* Error message */}
      {rangeError && (
        <div style={{ marginTop: 12, background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e53e3e', fontWeight: 600 }}>
          {rangeError}
        </div>
      )}

      {/* Min nights warning */}
      {minNightsWarning && (
        <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>
          Estancia mínima: {requiredMinNights} noche{requiredMinNights > 1 ? 's' : ''}
        </div>
      )}

      {/* Price summary */}
      {checkIn && checkOut && nights > 0 && !minNightsWarning && (
        <div style={{ marginTop: 16, background: '#f0f9f6', border: '1.5px solid #4B766B', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 6 }}>
            <span>{fmtDate(checkIn)} → {fmtDate(checkOut)}</span>
            <span>{nights} noche{nights > 1 ? 's' : ''}</span>
          </div>
          {allSamePrice ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 6 }}>
              <span>{nightlyBreakdown[0]?.price ?? midPrice}€ × {nights} noches</span>
              <span>{(nightlyBreakdown[0]?.price ?? midPrice) * nights}€</span>
            </div>
          ) : (
            nightlyBreakdown.reduce((acc: Array<{price: number; count: number}>, n) => {
              const last = acc[acc.length - 1]
              if (last && last.price === n.price) { last.count++; return acc }
              return [...acc, { price: n.price, count: 1 }]
            }, []).map((g, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 4 }}>
                <span>{g.price}€/n × {g.count} noche{g.count > 1 ? 's' : ''}</span>
                <span>{g.price * g.count}€</span>
              </div>
            ))
          )}
          {cleaningFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#555', marginBottom: 10 }}>
              <span>Limpieza</span><span>{cleaningFee}€</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: '#1a1a2e', borderTop: '1px solid #b2d4cc', paddingTop: 10 }}>
            <span>Total estimado</span>
            <span style={{ color: '#4B766B' }}>{total}€</span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#888' }}>* El precio exacto se confirma al revisar tu solicitud.</p>
        </div>
      )}

      {/* CTA */}
      {checkIn && !checkOut && (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#888', textAlign: 'center' }}>
          Selecciona la fecha de salida
        </p>
      )}
      {!checkIn && (
        <p style={{ margin: '12px 0 0', fontSize: 13, color: '#888', textAlign: 'center' }}>
          Selecciona fecha de llegada
        </p>
      )}

      {checkIn && checkOut && nights > 0 && !minNightsWarning && (
        <Link
          href={`/reservar/${slug}?checkin=${checkIn}&checkout=${checkOut}`}
          style={{
            display: 'block', marginTop: 16, background: '#4B766B', color: '#fff',
            textAlign: 'center', padding: '14px', borderRadius: 12, fontWeight: 700,
            fontSize: 14, textDecoration: 'none', letterSpacing: 0.5,
          }}
        >
          Solicitar reserva
        </Link>
      )}
    </div>
  )
}
