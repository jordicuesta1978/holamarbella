'use client'

import { useState } from 'react'

export type DayMark = { bg: string; color?: string; label?: string }

type Props = {
  markedDates: Record<string, DayMark>
  initialYear: number
  initialMonth: number
  legend?: Array<{ bg: string; label: string }>
  onDayClick?: (dateKey: string, mark: DayMark | undefined) => void
  labelFontSize?: number
}

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekday(year: number, month: number) {
  // 0=Sun → remap to Mon-based (0=Mon)
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

export default function CalendarGrid({ markedDates, initialYear, initialMonth, legend, onDayClick, labelFontSize = 8 }: Props) {
  const today = new Date()
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else { setMonth(m => m - 1) }
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else { setMonth(m => m + 1) }
  }

  const numDays = daysInMonth(year, month)
  const startOffset = firstWeekday(year, month)

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: numDays }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{MONTHS_ES[month]} {year}</span>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 14 }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
        {DAYS_ES.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#aaa', padding: '4px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const mark = markedDates[key]
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          return (
            <div
              key={key}
              title={mark?.label}
              onClick={() => onDayClick?.(key, mark)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: isToday ? 800 : 400,
                background: mark?.bg ?? (isToday ? '#e8f4f0' : '#f8fafc'),
                color: mark?.color ?? (isToday ? '#4B766B' : '#555'),
                border: isToday ? '2px solid #4B766B' : '1px solid transparent',
                cursor: onDayClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {day}
              {mark?.label && (
                <span style={{
                  position: 'absolute', bottom: 1, left: 0, right: 0,
                  fontSize: labelFontSize, textAlign: 'center', overflow: 'hidden',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  color: mark.color ?? '#444', opacity: 0.85,
                  paddingInline: 1, lineHeight: 1,
                }}>
                  {mark.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {legend && legend.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          {legend.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#666' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: l.bg }} />
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
