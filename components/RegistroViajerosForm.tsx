'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { crearRegistro, type RegistroInput } from '@/app/actions/registro'

const EMPTY = {
  nombre: '',
  apellidos: '',
  sexo: '',
  tipoDocumento: '',
  numeroDocumento: '',
  numeroSoporte: '',
  nacionalidad: '',
  fechaNacimiento: '',
  direccion: '',
  localidad: '',
  codigoPostal: '',
  pais: '',
  telefonoMovil: '',
  telefonoFijo: '',
  email: '',
  numViajeros: '1',
  parentesco: '',
}
type FormState = typeof EMPTY

const LABEL_CLS = 'block text-xs font-bold uppercase tracking-widest mb-1.5'
const FIELD_CLS = 'w-full rounded-xl border px-4 py-2.5 text-sm outline-none'
const FIELD_STYLE: React.CSSProperties = { borderColor: 'var(--outline-variant)', backgroundColor: 'white', color: 'var(--on-surface)' }
const ERR_STYLE: React.CSSProperties = { borderColor: '#dc2626' }
const SECTION_CLS = 'text-lg md:text-xl font-bold mb-5 pt-4'

function isMinor(birth: string): boolean {
  if (!birth) return false
  const b = new Date(birth)
  if (isNaN(b.getTime())) return false
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age < 18
}

// Module-scope field component — defined here (not inside the form) so inputs
// keep focus and don't remount on every keystroke.
function Field({
  label, value, onChange, error, type = 'text', optional, optionalText, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: boolean
  type?: string
  optional?: boolean
  optionalText?: string
  hint?: string
}) {
  return (
    <div>
      <label className={LABEL_CLS} style={{ color: 'var(--on-surface-variant)' }}>
        {label}{optional && <span className="font-normal normal-case"> {optionalText}</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={FIELD_CLS}
        style={error ? { ...FIELD_STYLE, ...ERR_STYLE } : FIELD_STYLE}
      />
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{hint}</p>}
    </div>
  )
}

export default function RegistroViajerosForm() {
  const t = useTranslations('registro')
  const [f, setF] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof FormState) => (v: string) => {
    setF(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: false }))
  }

  const isDni = f.tipoDocumento === 'DNI'
  const minor = isMinor(f.fechaNacimiento)

  function validate(): boolean {
    const req: (keyof FormState)[] = [
      'nombre', 'apellidos', 'sexo', 'tipoDocumento', 'numeroDocumento',
      'nacionalidad', 'fechaNacimiento', 'direccion', 'localidad', 'codigoPostal',
      'pais', 'telefonoMovil', 'numViajeros',
    ]
    if (isDni) req.push('numeroSoporte')
    if (minor) req.push('parentesco')
    const next: Record<string, boolean> = {}
    for (const k of req) if (!String(f[k]).trim()) next[k] = true
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    if (!validate()) return
    setSubmitting(true)
    const input: RegistroInput = {
      nombre: f.nombre.trim(),
      apellidos: f.apellidos.trim(),
      sexo: f.sexo,
      tipoDocumento: f.tipoDocumento,
      numeroDocumento: f.numeroDocumento.trim(),
      numeroSoporte: f.numeroSoporte.trim() || undefined,
      nacionalidad: f.nacionalidad.trim(),
      fechaNacimiento: f.fechaNacimiento,
      direccion: f.direccion.trim(),
      localidad: f.localidad.trim(),
      codigoPostal: f.codigoPostal.trim(),
      pais: f.pais.trim(),
      telefonoMovil: f.telefonoMovil.trim(),
      telefonoFijo: f.telefonoFijo.trim() || undefined,
      email: f.email.trim() || undefined,
      numViajeros: Number(f.numViajeros) || 1,
      parentesco: f.parentesco.trim() || undefined,
    }
    try {
      const res = await crearRegistro(input)
      if (res.ok) {
        setDone(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setServerError(t('errorGeneric'))
      }
    } catch {
      setServerError(t('errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border p-8 md:p-10 text-center" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--arena)' }}>
            <Check size={32} strokeWidth={2} style={{ color: 'var(--primary)' }} />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--primary)' }}>{t('successTitle')}</h2>
        <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>{t('successText')}</p>
        <button
          onClick={() => { setF(EMPTY); setDone(false) }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {t('another')}
        </button>
      </div>
    )
  }

  const opt = t('optional')

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border p-6 md:p-8" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }} noValidate>
      {/* Datos personales */}
      <h3 className={SECTION_CLS} style={{ color: 'var(--primary)' }}>{t('personalTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('nombre')} value={f.nombre} onChange={set('nombre')} error={errors.nombre} />
        <Field label={t('apellidos')} value={f.apellidos} onChange={set('apellidos')} error={errors.apellidos} />
        <div>
          <label className={LABEL_CLS} style={{ color: 'var(--on-surface-variant)' }}>{t('sexo')}</label>
          <select value={f.sexo} onChange={e => set('sexo')(e.target.value)} className={FIELD_CLS} style={errors.sexo ? { ...FIELD_STYLE, ...ERR_STYLE } : FIELD_STYLE}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="M">{t('sexoM')}</option>
            <option value="F">{t('sexoF')}</option>
          </select>
        </div>
        <div>
          <label className={LABEL_CLS} style={{ color: 'var(--on-surface-variant)' }}>{t('tipoDocumento')}</label>
          <select value={f.tipoDocumento} onChange={e => set('tipoDocumento')(e.target.value)} className={FIELD_CLS} style={errors.tipoDocumento ? { ...FIELD_STYLE, ...ERR_STYLE } : FIELD_STYLE}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="DNI">{t('docDni')}</option>
            <option value="Pasaporte">{t('docPasaporte')}</option>
            <option value="TIE">{t('docTie')}</option>
          </select>
        </div>
        <Field label={t('numeroDocumento')} value={f.numeroDocumento} onChange={set('numeroDocumento')} error={errors.numeroDocumento} />
        {isDni && <Field label={t('numeroSoporte')} value={f.numeroSoporte} onChange={set('numeroSoporte')} error={errors.numeroSoporte} hint={t('numeroSoporteHint')} />}
        <Field label={t('nacionalidad')} value={f.nacionalidad} onChange={set('nacionalidad')} error={errors.nacionalidad} />
        <Field label={t('fechaNacimiento')} value={f.fechaNacimiento} onChange={set('fechaNacimiento')} error={errors.fechaNacimiento} type="date" />
      </div>

      {/* Residencia */}
      <h3 className={SECTION_CLS} style={{ color: 'var(--primary)' }}>{t('residenceTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Field label={t('direccion')} value={f.direccion} onChange={set('direccion')} error={errors.direccion} /></div>
        <Field label={t('localidad')} value={f.localidad} onChange={set('localidad')} error={errors.localidad} />
        <Field label={t('codigoPostal')} value={f.codigoPostal} onChange={set('codigoPostal')} error={errors.codigoPostal} />
        <Field label={t('pais')} value={f.pais} onChange={set('pais')} error={errors.pais} />
      </div>

      {/* Contacto y estancia (sin encabezado de sección) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Field label={t('telefonoMovil')} value={f.telefonoMovil} onChange={set('telefonoMovil')} error={errors.telefonoMovil} type="tel" />
        <Field label={t('telefonoFijo')} value={f.telefonoFijo} onChange={set('telefonoFijo')} type="tel" optional optionalText={opt} />
        <Field label={t('email')} value={f.email} onChange={set('email')} type="email" optional optionalText={opt} />
        <Field label={t('numViajeros')} value={f.numViajeros} onChange={set('numViajeros')} error={errors.numViajeros} type="number" />
        {minor && (
          <div className="sm:col-span-2">
            <Field label={t('parentesco')} value={f.parentesco} onChange={set('parentesco')} error={errors.parentesco} hint={t('parentescoHint')} />
          </div>
        )}
      </div>

      {serverError && <p className="mt-6 text-sm font-semibold" style={{ color: '#dc2626' }}>{serverError}</p>}
      {Object.keys(errors).length > 0 && <p className="mt-6 text-sm" style={{ color: '#dc2626' }}>{t('checkRequired')}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
