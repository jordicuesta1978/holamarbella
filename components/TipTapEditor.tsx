'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { useState } from 'react'

interface Props {
  name: string
  defaultValue?: string
  minHeight?: number
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
}

const TOOLBAR_BTN_ACTIVE: React.CSSProperties = {
  ...TOOLBAR_BTN,
  background: '#4B766B',
  color: '#fff',
  borderColor: '#4B766B',
}

export default function TipTapEditor({ name, defaultValue = '', minHeight = 180 }: Props) {
  const [html, setHtml] = useState(defaultValue)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Image],
    content: defaultValue || '',
    onUpdate({ editor }) {
      setHtml(editor.getHTML())
    },
  })

  function btn(label: string, action: () => void, active?: boolean, title?: string) {
    return (
      <button
        key={label}
        type="button"
        title={title ?? label}
        onMouseDown={(e) => { e.preventDefault(); action() }}
        style={active ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
      >
        {label}
      </button>
    )
  }

  function insertImage() {
    const url = window.prompt('URL de la imagen:')
    if (url) editor?.chain().focus().setImage({ src: url }).run()
  }

  const sep = <div style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '6px 10px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
      }}>
        {btn('B', () => editor?.chain().focus().toggleBold().run(), editor?.isActive('bold'), 'Negrita')}
        {btn('I', () => editor?.chain().focus().toggleItalic().run(), editor?.isActive('italic'), 'Itálica')}
        {sep}
        {btn('H2', () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), editor?.isActive('heading', { level: 2 }))}
        {btn('H3', () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), editor?.isActive('heading', { level: 3 }))}
        {sep}
        {btn('• Lista', () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive('bulletList'))}
        {sep}
        {btn('Imagen', insertImage, false, 'Insertar imagen por URL')}
      </div>

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
        .tiptap ul { padding-left: 20px; margin: 0 0 10px; }
        .tiptap li { margin-bottom: 4px; }
        .tiptap strong { font-weight: 700; }
        .tiptap em { font-style: italic; }
        .tiptap img { max-width: 100%; border-radius: 6px; margin: 6px 0; }
        .tiptap p.is-editor-empty:first-child::before {
          color: #aaa;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
