import { notFound } from 'next/navigation'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { getRegistro } from '../actions'
import { RegistroDetalleActions } from './RegistroDetalleActions'

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic'

const APT_NAMES: Record<string, string> = {
  paloma: 'Apartamento Paloma', micu: 'Apartamento Micu',
  larysol: 'Apartamento Larysol', ami: 'Ático AMI', banesto: 'Ático Banesto',
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#999' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#1a1a2e' }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#4B766B', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 24px' }}>
        {children}
      </div>
    </div>
  )
}

export default async function RegistroDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = Number(idStr)
  if (!id) notFound()

  const r = await getRegistro(id)
  if (!r) notFound()

  const sexoLabel = r.sexo === 'M' ? 'Masculino' : r.sexo === 'F' ? 'Femenino' : r.sexo || '—'
  const docParts = [r.tipo_documento, r.numero_documento, r.numero_soporte ? `(soporte: ${r.numero_soporte})` : ''].filter(Boolean).join(' ')

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <a href="/admin/registros" style={{ fontSize: 13, color: '#4B766B', textDecoration: 'none', fontWeight: 600 }}>
              ← Volver a registros
            </a>
            <h1 style={{ margin: '6px 0 2px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
              {r.nombre} {r.apellidos}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
              Registro #{r.id} · {fmtDateTime(r.created_at)}
            </p>
          </div>

          {/* Estado verificado */}
          {r.verificado ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 16px' }}>
              <span style={{ fontSize: 18, color: '#16a34a' }}>✓</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#16a34a' }}>Enviado a policía</div>
                <div style={{ fontSize: 11, color: '#4ade80' }}>{fmtDateTime(r.verificado_at)}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 16px' }}>
              <span style={{ fontSize: 16, color: '#d97706' }}>○</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#d97706' }}>Pendiente de envío</span>
            </div>
          )}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '28px 32px', marginBottom: 20 }}>
          <Section title="Datos personales">
            <Field label="Nombre" value={r.nombre} />
            <Field label="Apellidos" value={r.apellidos} />
            <Field label="Sexo" value={sexoLabel} />
            <Field label="Documento" value={docParts} />
            <Field label="Nacionalidad" value={r.nacionalidad} />
            <Field label="Fecha de nacimiento" value={fmtDate(r.fecha_nacimiento)} />
          </Section>

          <Section title="Residencia habitual">
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Dirección completa" value={r.direccion} />
            </div>
            <Field label="Localidad" value={r.localidad} />
            <Field label="Código postal" value={r.codigo_postal} />
            <Field label="País" value={r.pais} />
          </Section>

          <Section title="Contacto y estancia">
            <Field label="Teléfono móvil" value={r.telefono_movil} />
            <Field label="Teléfono fijo" value={r.telefono_fijo} />
            <Field label="Email" value={r.email} />
            <Field label="Número de viajeros" value={r.num_viajeros ? String(r.num_viajeros) : null} />
            <Field label="Parentesco" value={r.parentesco} />
            <Field label="Apartamento" value={r.apartment_slug ? (APT_NAMES[r.apartment_slug] ?? r.apartment_slug) : null} />
          </Section>
        </div>

        {/* Acciones */}
        <RegistroDetalleActions id={r.id} verificado={r.verificado ?? false} />
      </div>
    </div>
  )
}
