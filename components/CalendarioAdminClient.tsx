'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CalendarGrid, { type DayMark } from '@/components/CalendarGrid'
import { addBloqueo, deleteBloqueo } from '@/app/admin/contenido/actions'

const APTS = [
  { slug: 'paloma', label: 'Paloma' },
  { slug: 'micu', label: 'Micu' },
  { slug: 'larysol', label: 'Larysol' },
  { slug: 'ami', label: 'AMI' },
  { slug: 'banesto', label: 'Banesto' },
]

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Bloqueo = { id: number; apartment_slug: string; fecha_inicio: string; fecha_fin: string; motivo: string }
type Reserva = { apartment_slug: string; check_in: string; check_out: string; guest_name: string }
type Precio = { apartment_slug: string; fecha_inicio: string; fecha_fin: string; precio_noche: number }

type Props = {
  bloqueos: Bloqueo[]
  reservas: Reserva[]
  precios: Precio[]
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildMarks(
  slug: string,
  bloqueos: Bloqueo[],
  reservas: Reserva[],
  precios: Precio[],
): Record<string, DayMark & { bloqueoId?: number }> {
  const marks: Record<string, DayMark & { bloqueoId?: number }> = {}

  for (const p of precios.filter(p => p.apartment_slug === slug)) {
    const start = new Date(p.fecha_inicio + 'T00:00:00')
    const end = new Date(p.fecha_fin + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      marks[key] = { bg: '#f0f9f6', color: '#4B766B', label: `${p.precio_noche}€/n` }
    }
  }

  for (const b of bloqueos.filter(b => b.apartment_slug === slug)) {
    const start = new Date(b.fecha_inicio + 'T00:00:00')
    const end = new Date(b.fecha_fin + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      marks[key] = { bg: '#e5e7eb', color: '#6b7280', label: b.motivo || 'Bloqueado', bloqueoId: b.id }
    }
  }

  for (const r of reservas.filter(r => r.apartment_slug === slug)) {
    const start = new Date(r.check_in + 'T00:00:00')
    const end = new Date(r.check_out + 'T00:00:00')
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      marks[key] = { bg: '#d1fae5', color: '#065f46', label: r.guest_name }
    }
  }

  return marks
}

type ModalState =
  | { type: 'add'; date: string }
  | { type: 'del'; bloqueoId: number; label: string; date: string }
  | null

export default function CalendarioAdminClient({ bloqueos, reservas, precios }: Props) {
  const router = useRouter()
  const [selectedSlug, setSelectedSlug] = useState('paloma')
  const [modal, setModal] = useState<ModalState>(null)
  const [motivo, setMotivo] = useState('')
  const [hastaInput, setHastaInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const marks = buildMarks(selectedSlug, bloqueos, reservas, precios)

  function handleDayClick(dateKey: string, mark: DayMark & { bloqueoId?: number } | undefined) {
    if (mark?.bloqueoId) {
      setModal({ type: 'del', bloqueoId: mark.bloqueoId, label: mark.label ?? '', date: dateKey })
    } else if (!mark || mark.bg === '#f0f9f6') {
      // free or precio-only → open add bloqueo modal
      setModal({ type: 'add', date: dateKey })
      setMotivo('')
      // Default hasta: day after
      const d = new Date(dateKey + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      setHastaInput(toKey(d))
    }
    // confirmed reserva days — no action
  }

  function handleAdd() {
    if (!modal || modal.type !== 'add') return
    startTransition(async () => {
      await addBloqueo(selectedSlug, modal.date, hastaInput, motivo)
      setModal(null)
      router.refresh()
    })
  }

  function handleDel() {
    if (!modal || modal.type !== 'del') return
    startTransition(async () => {
      await deleteBloqueo(modal.bloqueoId)
      setModal(null)
      router.refresh()
    })
  }

  const aptBloqueos = bloqueos.filter(b => b.apartment_slug === selectedSlug)
  const aptReservas = reservas.filter(r => r.apartment_slug === selectedSlug)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Apartment selector */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>Apartamento</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {APTS.map(a => (
            <button
              key={a.slug}
              onClick={() => setSelectedSlug(a.slug)}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: selectedSlug === a.slug ? '#4B766B' : '#f8fafc',
                color: selectedSlug === a.slug ? '#fff' : '#555',
                border: `1.5px solid ${selectedSlug === a.slug ? '#4B766B' : '#e2e8f0'}`,
                cursor: 'pointer',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>
            Calendario — {APTS.find(a => a.slug === selectedSlug)?.label}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#aaa' }}>
            Clic en día libre para bloquear · Clic en bloqueo gris para eliminar
          </p>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <CalendarGrid
            markedDates={marks}
            initialYear={now.getFullYear()}
            initialMonth={now.getMonth()}
            labelFontSize={10}
            onDayClick={(k, m) => handleDayClick(k, m as DayMark & { bloqueoId?: number })}
            legend={[
              { bg: '#d1fae5', label: 'Reserva confirmada' },
              { bg: '#e5e7eb', label: 'Bloqueado manualmente' },
              { bg: '#f0f9f6', label: 'Precio configurado' },
              { bg: '#f8fafc', label: 'Libre' },
            ]}
          />
        </div>
      </div>

      {/* Reservas próximas */}
      {aptReservas.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Reservas confirmadas</h2>
          </div>
          {aptReservas.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < aptReservas.length - 1 ? '1px solid #f5f5f5' : undefined }}>
              <span style={{ fontSize: 13, color: '#1a1a2e', flex: 1 }}>
                <strong>{r.guest_name}</strong>
                <span style={{ color: '#888', marginLeft: 8 }}>· {fmt(r.check_in)} → {fmt(r.check_out)}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bloqueos activos */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Bloqueos activos ({aptBloqueos.length})</h2>
        </div>
        {aptBloqueos.length === 0 ? (
          <p style={{ padding: '20px', fontSize: 13, color: '#aaa', textAlign: 'center', margin: 0 }}>No hay bloqueos para este apartamento</p>
        ) : aptBloqueos.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < aptBloqueos.length - 1 ? '1px solid #f5f5f5' : undefined }}>
            <span style={{ fontSize: 13, color: '#1a1a2e', flex: 1 }}>
              {fmt(b.fecha_inicio)} → {fmt(b.fecha_fin)}
              {b.motivo && <span style={{ color: '#888', marginLeft: 8 }}>· {b.motivo}</span>}
            </span>
            <button
              onClick={() => setModal({ type: 'del', bloqueoId: b.id, label: b.motivo || 'Bloqueado', date: b.fecha_inicio })}
              style={{ background: 'none', border: '1px solid #fecaca', color: '#e53e3e', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {/* Inline form for adding bloqueos */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Bloquear fechas manualmente</h2>
        </div>
        <AddBloqueoForm slug={selectedSlug} isPending={isPending} startTransition={startTransition} onDone={() => router.refresh()} />
      </div>

      {/* Modal overlay */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {modal.type === 'add' ? (
              <>
                <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Bloquear fechas</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Desde</label>
                    <input type="date" value={modal.date} readOnly style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, background: '#f8fafc', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Hasta (excl.)</label>
                    <input type="date" value={hastaInput} min={modal.date} onChange={e => setHastaInput(e.target.value)} style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 4 }}>Motivo (opcional)</label>
                    <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Mantenimiento, reserva propia…" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f4f5f7', color: '#555', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                    <button onClick={handleAdd} disabled={isPending || !hastaInput || hastaInput <= modal.date} style={{ flex: 1, background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
                      {isPending ? 'Guardando…' : 'Bloquear'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>Eliminar bloqueo</h2>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: '#666' }}>
                  ¿Eliminar el bloqueo del {fmt(modal.date)}{modal.label !== 'Bloqueado' ? ` (${modal.label})` : ''}?
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setModal(null)} style={{ flex: 1, background: '#f4f5f7', color: '#555', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={handleDel} disabled={isPending} style={{ flex: 1, background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
                    {isPending ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function AddBloqueoForm({ slug, isPending, startTransition, onDone }: {
  slug: string
  isPending: boolean
  startTransition: (fn: () => Promise<void>) => void
  onDone: () => void
}) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [motivo, setMotivo] = useState('')

  function handle() {
    if (!desde || !hasta || hasta <= desde) return
    startTransition(async () => {
      await addBloqueo(slug, desde, hasta, motivo)
      setDesde(''); setHasta(''); setMotivo('')
      onDone()
    })
  }

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Desde</label>
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)} required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Hasta (excl.)</label>
        <input type="date" value={hasta} min={desde} onChange={e => setHasta(e.target.value)} required style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none' }} />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>Motivo (opcional)</label>
        <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Mantenimiento, reserva propia..." style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <button
        type="button"
        onClick={handle}
        disabled={isPending || !desde || !hasta || hasta <= desde}
        style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: isPending ? 0.6 : 1 }}
      >
        {isPending ? 'Guardando…' : 'Bloquear'}
      </button>
    </div>
  )
}
