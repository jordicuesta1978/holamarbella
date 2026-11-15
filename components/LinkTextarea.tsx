'use client'

import { useRef, useState } from 'react'
import { Link2 } from 'lucide-react'
import { normalizeUrl } from '@/lib/links'

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'defaultValue' | 'onChange'> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

/**
 * Textarea del admin con botón "Enlace": selecciona un texto, pulsa Enlace y pega la URL.
 * Se guarda como [texto](url) y en la web pública se muestra como enlace (ver RichText).
 */
export default function LinkTextarea({ value, defaultValue, onValueChange, style, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [inner, setInner] = useState(defaultValue ?? '')
  const text = value ?? inner
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [range, setRange] = useState<[number, number]>([0, 0])

  function set(v: string) {
    if (value === undefined) setInner(v)
    onValueChange?.(v)
  }

  function openPanel() {
    const el = ref.current
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? text.length
    setRange([start, end])
    setLabel(text.slice(start, end))
    setUrl('')
    setOpen(true)
  }

  function apply() {
    const href = normalizeUrl(url)
    if (!href) return
    const [start, end] = range
    const name = (label.trim() || url.trim()).replace(/[[\]]/g, '')
    const md = `[${name}](${href})`
    const next = text.slice(0, start) + md + text.slice(end)
    set(next)
    setOpen(false)
    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      el.focus()
      el.setSelectionRange(start + md.length, start + md.length)
    })
  }

  const small: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px', fontSize: 12, outline: 'none', boxSizing: 'border-box' }

  return (
    <div>
      <textarea
        {...rest}
        ref={ref}
        value={text}
        onChange={e => set(e.target.value)}
        style={style}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
        <button
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => (open ? setOpen(false) : openPanel())}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: open ? '#4B766B' : 'transparent', color: open ? '#fff' : '#4B766B', border: '1px solid #cfe0db', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          <Link2 size={13} /> Enlace
        </button>
        {!open && <span style={{ fontSize: 11, color: '#aaa' }}>Selecciona un texto y pulsa Enlace</span>}
      </div>
      {open && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Texto del enlace"
            style={{ ...small, flex: '1 1 140px' }}
          />
          <input
            type="url"
            inputMode="url"
            autoFocus
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply() } if (e.key === 'Escape') setOpen(false) }}
            placeholder="https://…"
            style={{ ...small, flex: '2 1 200px' }}
          />
          <button type="button" onClick={apply} disabled={!url.trim()} style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: url.trim() ? 1 : 0.5 }}>
            Añadir
          </button>
          <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
