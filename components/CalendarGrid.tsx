'use client'

import { useState } from 'react'

export type DayMark = { bg: string; color?: string; label?: string }

type Props = {
  markedDates: Record<string, DayMark>
  initialYear: number
  initialMonth: number
  legend?: Array<{ bg: string; label: string }>
  onDayClick?: (dateKey: string, mark: DayMark | undefined) => void
  /** Font size for the label below the day number. Default 11. */
  labelFontSize?: number
}

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

export default function CalendarGrid({
  markedDates, initialYear, initialMonth, legend, onDayClick, labelFontSize = 11,
}: Props) {
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
          if (!day) return <div key={`e-${idx}`} style={{ minHeight: 48 }} />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const mark = markedDates[key]
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
          const hasLabel = !!mark?.label

          return (
            <div
              key={key}
              title={mark?.label}
              onClick={() => onDayClick?.(key, mark)}
              style={{
                minHeight: hasLabel ? 52 : 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: hasLabel ? 'flex-start' : 'center',
                paddingTop: hasLabel ? 6 : 0,
                paddingBottom: hasLabel ? 6 : 0,
                borderRadius: 6,
                background: mark?.bg ?? (isToday ? '#e8f4f0' : '#f8fafc'),
                color: mark?.color ?? (isToday ? '#4B766B' : '#555'),
                border: isToday ? '2px solid #4B766B' : '1px solid transparent',
                cursor: onDayClick ? 'pointer' : 'default',
                gap: 2,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, lineHeight: 1 }}>{day}</span>
              {mark?.label && (
                <span style={{
                  fontSize: labelFontSize,
                  fontWeight: 700,
                  color: mark.color ?? '#1a1a2e',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  paddingInline: 2,
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
