'use client'

import { useState, useTransition } from 'react'
import { saveApartmentTranslation } from '@/app/admin/contenido/actions'

// Nombres legibles por locale. Si falta uno, se muestra el código en mayúsculas.
const LOCALE_NAMES: Record<string, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
}

const FEATURE_SEP = ' · '

type Form = { name: string; subtitle: string; description: string; keyFeatures: string; topAmenities: string }
type Initial = Record<string, { name: string; subtitle: string; description: string; key_features: string[]; top_amenities: string[] }>

export default function ApartmentTranslations({
  slug,
  locales,
  esReference,
  initial,
}: {
  slug: string
  locales: string[]
  esReference: { name: string; subtitle: string; description: string; keyFeatures: string; topAmenities: string }
  initial: Initial
}) {
  const [active, setActive] = useState(locales[0] ?? '')
  const [forms, setForms] = useState<Record<string, Form>>(() => {
    const seed: Record<string, Form> = {}
    for (const l of locales) {
      const tr = initial[l]
      seed[l] = {
        name: tr?.name ?? '',
        subtitle: tr?.subtitle ?? '',
        description: tr?.description ?? '',
        keyFeatures: (tr?.key_features ?? []).join(FEATURE_SEP),
        topAmenities: (tr?.top_amenities ?? []).join(', '),
      }
    }
    return seed
  })
  const [pending, startTransition] = useTransition()
  const [savedLocale, setSavedLocale] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (locales.length === 0) return null

  const cur = forms[active]
  const update = (patch: Partial<Form>) => {
    setSavedLocale(null)
    setErrorMsg(null)
    setForms(f => ({ ...f, [active]: { ...f[active], ...patch } }))
  }

  const save = () => {
    setSavedLocale(null)
    setErrorMsg(null)
    const key_features = cur.keyFeatures
      .split('·')
      .map(s => s.trim())
      .filter(Boolean)
    const top_amenities = cur.topAmenities
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    startTransition(async () => {
      try {
        await saveApartmentTranslation(slug, active, {
          name: cur.name,
          subtitle: cur.subtitle,
          description: cur.description,
          key_features,
          top_amenities,
        })
        setSavedLocale(active)
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px',
    fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '16px 20px', borderTop: '1px solid #f0f0f0', background: '#fafbfc' }}>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
          Traducciones
        </label>
        <span style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
          El español es el idioma base (campos de arriba). Aquí se traduce a los demás idiomas; lo que quede vacío usa el español.
        </span>
      </div>

      {/* Selector de idioma — dinámico según locales soportados */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {locales.map(l => {
          const isActive = l === active
          return (
            <button
              key={l}
              type="button"
              onClick={() => { setActive(l); setSavedLocale(null); setErrorMsg(null) }}
              style={{
                fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                border: `1px solid ${isActive ? '#4B766B' : '#e2e8f0'}`,
                background: isActive ? '#4B766B' : '#fff',
                color: isActive ? '#fff' : '#555',
              }}
            >
              {LOCALE_NAMES[l] ?? l.toUpperCase()}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, color: '#aaa' }}>Nombre</span>
          <input
            type="text"
            value={cur.name}
            placeholder={esReference.name}
            onChange={e => update({ name: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <span style={{ fontSize: 11, color: '#aaa' }}>Subtítulo</span>
          <input
            type="text"
            value={cur.subtitle}
            placeholder={esReference.subtitle}
            onChange={e => update({ subtitle: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <span style={{ fontSize: 11, color: '#aaa' }}>Descripción</span>
          <textarea
            value={cur.description}
            placeholder={esReference.description}
            onChange={e => update({ description: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div>
          <span style={{ fontSize: 11, color: '#aaa' }}>Características clave (separadas por ·)</span>
          <input
            type="text"
            value={cur.keyFeatures}
            placeholder={esReference.keyFeatures}
            onChange={e => update({ keyFeatures: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div>
          <span style={{ fontSize: 11, color: '#aaa' }}>Top amenidades (separadas por coma)</span>
          <textarea
            value={cur.topAmenities}
            placeholder={esReference.topAmenities}
            onChange={e => update({ topAmenities: e.target.value })}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            style={{
              background: '#4B766B', color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: pending ? 'default' : 'pointer',
              opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? 'Guardando…' : `Guardar ${LOCALE_NAMES[active] ?? active.toUpperCase()}`}
          </button>
          {savedLocale === active && !pending && (
            <span style={{ fontSize: 12, color: '#4B766B', fontWeight: 600 }}>✓ Guardado</span>
          )}
          {errorMsg && (
            <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>{errorMsg}</span>
          )}
        </div>
      </div>
    </div>
  )
}
