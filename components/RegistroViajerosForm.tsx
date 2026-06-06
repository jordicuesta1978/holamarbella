'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ShieldCheck, Check } from 'lucide-react'
import { crearRegistro, type RegistroInput } from '@/app/actions/registro'

type Apartment = { slug: string; title: string }

const EMPTY = {
  apartmentSlug: '',
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

export default function RegistroViajerosForm({ apartments }: { apartments: Apartment[] }) {
  const t = useTranslations('registro')
  const [f, setF] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof FormState, v: string) => {
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
      apartmentSlug: f.apartmentSlug || undefined,
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

  const labelCls = 'block text-xs font-bold uppercase tracking-widest mb-1.5'
  const fieldCls = 'w-full rounded-xl border px-4 py-2.5 text-sm outline-none'
  const fieldStyle = { borderColor: 'var(--outline-variant)', backgroundColor: 'white', color: 'var(--on-surface)' } as React.CSSProperties
  const errStyle = { borderColor: '#dc2626' } as React.CSSProperties
  const sectionTitleCls = 'text-xs font-bold uppercase tracking-widest mb-4 pt-2'

  const Field = ({ name, label, type = 'text', optional = false, hint }: { name: keyof FormState; label: string; type?: string; optional?: boolean; hint?: string }) => (
    <div>
      <label className={labelCls} style={{ color: 'var(--on-surface-variant)' }}>
        {label}{optional && <span className="font-normal normal-case"> {t('optional')}</span>}
      </label>
      <input
        type={type}
        value={f[name]}
        onChange={e => set(name, e.target.value)}
        className={fieldCls}
        style={errors[name] ? { ...fieldStyle, ...errStyle } : fieldStyle}
      />
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{hint}</p>}
    </div>
  )

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border p-6 md:p-8" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }} noValidate>
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />
        <span className="text-sm font-bold" style={{ color: 'var(--on-surface)' }}>RD 933/2021</span>
      </div>

      {/* Apartamento (opcional) */}
      {apartments.length > 0 && (
        <div className="mb-5">
          <label className={labelCls} style={{ color: 'var(--on-surface-variant)' }}>
            {t('apartmentLabel')}<span className="font-normal normal-case"> {t('optional')}</span>
          </label>
          <select value={f.apartmentSlug} onChange={e => set('apartmentSlug', e.target.value)} className={fieldCls} style={fieldStyle}>
            <option value="">{t('apartmentPlaceholder')}</option>
            {apartments.map(a => <option key={a.slug} value={a.slug}>{a.title}</option>)}
          </select>
        </div>
      )}

      {/* Datos personales */}
      <h3 className={sectionTitleCls} style={{ color: 'var(--primary)' }}>{t('personalTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="nombre" label={t('nombre')} />
        <Field name="apellidos" label={t('apellidos')} />
        <div>
          <label className={labelCls} style={{ color: 'var(--on-surface-variant)' }}>{t('sexo')}</label>
          <select value={f.sexo} onChange={e => set('sexo', e.target.value)} className={fieldCls} style={errors.sexo ? { ...fieldStyle, ...errStyle } : fieldStyle}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="M">{t('sexoM')}</option>
            <option value="F">{t('sexoF')}</option>
          </select>
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--on-surface-variant)' }}>{t('tipoDocumento')}</label>
          <select value={f.tipoDocumento} onChange={e => set('tipoDocumento', e.target.value)} className={fieldCls} style={errors.tipoDocumento ? { ...fieldStyle, ...errStyle } : fieldStyle}>
            <option value="">{t('selectPlaceholder')}</option>
            <option value="DNI">{t('docDni')}</option>
            <option value="Pasaporte">{t('docPasaporte')}</option>
            <option value="TIE">{t('docTie')}</option>
          </select>
        </div>
        <Field name="numeroDocumento" label={t('numeroDocumento')} />
        {isDni && <Field name="numeroSoporte" label={t('numeroSoporte')} hint={t('numeroSoporteHint')} />}
        <Field name="nacionalidad" label={t('nacionalidad')} />
        <Field name="fechaNacimiento" label={t('fechaNacimiento')} type="date" />
      </div>

      {/* Residencia */}
      <h3 className={sectionTitleCls} style={{ color: 'var(--primary)' }}>{t('residenceTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Field name="direccion" label={t('direccion')} /></div>
        <Field name="localidad" label={t('localidad')} />
        <Field name="codigoPostal" label={t('codigoPostal')} />
        <Field name="pais" label={t('pais')} />
      </div>

      {/* Contacto y estancia */}
      <h3 className={sectionTitleCls} style={{ color: 'var(--primary)' }}>{t('contactTitle')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field name="telefonoMovil" label={t('telefonoMovil')} type="tel" />
        <Field name="telefonoFijo" label={t('telefonoFijo')} type="tel" optional />
        <Field name="email" label={t('email')} type="email" optional />
        <Field name="numViajeros" label={t('numViajeros')} type="number" />
        {minor && (
          <div className="sm:col-span-2">
            <Field name="parentesco" label={t('parentesco')} hint={t('parentescoHint')} />
          </div>
        )}
      </div>

      {serverError && (
        <p className="mt-6 text-sm font-semibold" style={{ color: '#dc2626' }}>{serverError}</p>
      )}
      {Object.keys(errors).length > 0 && (
        <p className="mt-6 text-sm" style={{ color: '#dc2626' }}>{t('checkRequired')}</p>
      )}

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
