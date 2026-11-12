'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { Extension } from '@tiptap/core'
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { useState } from 'react'
import {
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  IndentIncrease, IndentDecrease, Loader2, ImagePlus, ListOrdered,
} from 'lucide-react'
import { uploadToStorage, pickFiles, uniqueFileName } from '@/lib/upload-client'

// ── Paleta de colores de la marca (limitada a propósito para que el blog sea coherente)
export const BRAND_COLORS: Array<{ name: string; value: string | null }> = [
  { name: 'Por defecto', value: null },
  { name: 'Verde HolaMarbella', value: '#4B766B' },
  { name: 'Verde oscuro', value: '#1A3021' },
  { name: 'Terracota', value: '#e07b5a' },
  { name: 'Azul mar', value: '#2f6f8f' },
  { name: 'Arena', value: '#a07c52' },
  { name: 'Gris', value: '#6b7280' },
  { name: 'Rojo', value: '#c0392b' },
]

// ── Interlineado: solo 3 opciones para que el texto se vea uniforme en móvil
const LINE_HEIGHTS: Array<{ label: string; value: string | null }> = [
  { label: 'Normal', value: null },
  { label: 'Compacto', value: '1.4' },
  { label: 'Amplio', value: '2.2' },
]

const MAX_INDENT = 4
const INDENT_EM = 2

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockStyle: {
      indent: () => ReturnType
      outdent: () => ReturnType
      setLineHeight: (value: string | null) => ReturnType
    }
  }
}

// Sangría e interlineado a nivel de párrafo/título. Se guardan como estilo
// en línea (margin-left / line-height) para que la web pública los muestre igual.
const BlockStyle = Extension.create({
  name: 'blockStyle',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        indent: {
          default: 0,
          parseHTML: el => {
            const ml = parseFloat((el as HTMLElement).style.marginLeft || '0')
            return Math.min(MAX_INDENT, Math.max(0, Math.round(ml / INDENT_EM)))
          },
          renderHTML: attrs => (attrs.indent ? { style: `margin-left: ${attrs.indent * INDENT_EM}em` } : {}),
        },
        lineHeight: {
          default: null,
          parseHTML: el => (el as HTMLElement).style.lineHeight || null,
          renderHTML: attrs => (attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {}),
        },
      },
    }]
  },
  addCommands() {
    const update = (fn: (attrs: Record<string, unknown>) => Record<string, unknown>) =>
      () => ({ state, tr, dispatch }: { state: import('@tiptap/pm/state').EditorState; tr: import('@tiptap/pm/state').Transaction; dispatch?: (tr: import('@tiptap/pm/state').Transaction) => void }) => {
        const { from, to } = state.selection
        let changed = false
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...fn(node.attrs) })
            changed = true
          }
        })
        if (changed && dispatch) dispatch(tr)
        return changed
      }
    return {
      indent: update(a => ({ indent: Math.min(MAX_INDENT, (Number(a.indent) || 0) + 1) })),
      outdent: update(a => ({ indent: Math.max(0, (Number(a.indent) || 0) - 1) })),
      setLineHeight: (value: string | null) => update(() => ({ lineHeight: value }))(),
    }
  },
})

interface Props {
  name: string
  defaultValue?: string
  minHeight?: number
  /** Carpeta del bucket "blog" donde se suben las imágenes insertadas en el texto */
  uploadPath?: string
}

const TOOLBAR_BTN: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #e2e8f0',
  borderRadius: 5,
  padding: '3px 9px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  color: '#555',
  lineHeight: 1.5,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  minHeight: 26,
}

const TOOLBAR_BTN_ACTIVE: React.CSSProperties = {
  ...TOOLBAR_BTN,
  background: '#4B766B',
  color: '#fff',
  borderColor: '#4B766B',
}

export default function TipTapEditor({ name, defaultValue = '', minHeight = 180, uploadPath = 'articulos/contenido' }: Props) {
  const [html, setHtml] = useState(defaultValue)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [colorOpen, setColorOpen] = useState(false)
  // Fuerza el re-render de la barra al mover el cursor (estado activo de los botones)
  const [, setTick] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      BlockStyle,
    ],
    content: defaultValue || '',
    onUpdate({ editor }) {
      setHtml(editor.getHTML())
    },
    onSelectionUpdate() {
      setTick(t => t + 1)
    },
  })

  function btn(label: React.ReactNode, action: () => void, active?: boolean, title?: string, key?: string) {
    return (
      <button
        key={key ?? String(title ?? label)}
        type="button"
        title={title}
        aria-label={title}
        onMouseDown={(e) => { e.preventDefault(); action() }}
        style={active ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
      >
        {label}
      </button>
    )
  }

  async function insertImage() {
    if (!editor || uploading) return
    const [file] = await pickFiles('image/*')
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const { url } = await uploadToStorage(file, 'blog', `${uploadPath}/${uniqueFileName(ext)}`)
      editor.chain().focus().setImage({ src: url, alt: '' }).run()
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Error al subir la imagen')
    }
    setUploading(false)
  }

  const currentColor = (editor?.getAttributes('textStyle').color as string | undefined) ?? null
  const blockAttrs = editor?.isActive('heading') ? editor.getAttributes('heading') : editor?.getAttributes('paragraph')
  const currentLH = (blockAttrs?.lineHeight as string | null | undefined) ?? null

  const sep = <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '6px 10px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        borderRadius: '8px 8px 0 0',
        position: 'relative',
      }}>
        {btn('B', () => editor?.chain().focus().toggleBold().run(), editor?.isActive('bold'), 'Negrita')}
        {btn(<em>I</em>, () => editor?.chain().focus().toggleItalic().run(), editor?.isActive('italic'), 'Cursiva')}

        {/* Color de fuente */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Color del texto"
            aria-label="Color del texto"
            onMouseDown={(e) => { e.preventDefault(); setColorOpen(v => !v) }}
            style={{ ...TOOLBAR_BTN, flexDirection: 'column', gap: 0, padding: '1px 9px', lineHeight: 1.1 }}
          >
            <span>A</span>
            <span style={{ display: 'block', width: 14, height: 3, borderRadius: 1, background: currentColor ?? '#2d2d2d' }} />
          </button>
          {colorOpen && (
            <div
              style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: 'repeat(4, 26px)', gap: 6 }}
              onMouseLeave={() => setColorOpen(false)}
            >
              {BRAND_COLORS.map(c => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (c.value) editor?.chain().focus().setColor(c.value).run()
                    else editor?.chain().focus().unsetColor().run()
                    setColorOpen(false)
                  }}
                  style={{
                    width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
                    background: c.value ?? '#fff',
                    border: (currentColor ?? null) === c.value ? '2px solid #1a1a2e' : '1px solid #d1d5db',
                    fontSize: 11, color: '#999', padding: 0,
                  }}
                >
                  {c.value ? '' : '∅'}
                </button>
              ))}
            </div>
          )}
        </div>
        {sep}
        {btn('H2', () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), editor?.isActive('heading', { level: 2 }), 'Título')}
        {btn('H3', () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), editor?.isActive('heading', { level: 3 }), 'Subtítulo')}
        {sep}
        {btn('• Lista', () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive('bulletList'), 'Lista con viñetas')}
        {btn(<ListOrdered size={14} />, () => editor?.chain().focus().toggleOrderedList().run(), editor?.isActive('orderedList'), 'Lista numerada')}
        {sep}
        {btn(<AlignLeft size={14} />, () => editor?.chain().focus().setTextAlign('left').run(), editor?.isActive({ textAlign: 'left' }), 'Alinear a la izquierda')}
        {btn(<AlignCenter size={14} />, () => editor?.chain().focus().setTextAlign('center').run(), editor?.isActive({ textAlign: 'center' }), 'Centrar')}
        {btn(<AlignRight size={14} />, () => editor?.chain().focus().setTextAlign('right').run(), editor?.isActive({ textAlign: 'right' }), 'Alinear a la derecha')}
        {btn(<AlignJustify size={14} />, () => editor?.chain().focus().setTextAlign('justify').run(), editor?.isActive({ textAlign: 'justify' }), 'Justificar')}
        {sep}
        {btn(<IndentDecrease size={14} />, () => editor?.chain().focus().outdent().run(), false, 'Reducir sangría')}
        {btn(<IndentIncrease size={14} />, () => editor?.chain().focus().indent().run(), false, 'Aumentar sangría')}
        {sep}
        <select
          title="Interlineado"
          aria-label="Interlineado"
          value={currentLH ?? ''}
          onChange={(e) => editor?.chain().focus().setLineHeight(e.target.value || null).run()}
          style={{ ...TOOLBAR_BTN, fontWeight: 600, padding: '2px 6px' }}
        >
          {LINE_HEIGHTS.map(l => <option key={l.label} value={l.value ?? ''}>Interlineado: {l.label}</option>)}
        </select>
        {sep}
        {btn(
          uploading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Subiendo…</> : <><ImagePlus size={14} /> Imagen</>,
          insertImage, false, 'Insertar imagen desde tu equipo', 'img'
        )}
      </div>

      {uploadError && <p style={{ margin: 0, padding: '4px 14px', fontSize: 11, color: '#e53e3e' }}>{uploadError}</p>}

      {/* Editor content */}
      <div style={{ minHeight, padding: '10px 14px', fontSize: 13, lineHeight: 1.7 }}>
        <EditorContent editor={editor} />
      </div>

      {/* Hidden input submitted with the form */}
      <input type="hidden" name={name} value={html} readOnly />

      <style>{`
        .tiptap { outline: none; }
        .tiptap p { margin: 0 0 10px; }
        .tiptap h2 { font-size: 17px; font-weight: 700; margin: 18px 0 8px; }
        .tiptap h3 { font-size: 15px; font-weight: 700; margin: 14px 0 6px; }
        .tiptap ul { padding-left: 20px; margin: 0 0 10px; list-style: disc; }
        .tiptap ol { padding-left: 20px; margin: 0 0 10px; list-style: decimal; }
        .tiptap li { margin-bottom: 4px; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap img { max-width: 100%; border-radius: 6px; margin: 6px 0; }
        .tiptap img.ProseMirror-selectednode { outline: 2px solid #4B766B; }
        .tiptap p.is-editor-empty:first-child::before {
          color: #aaa;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
