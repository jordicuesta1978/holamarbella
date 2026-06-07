'use client'

import { useRouter } from 'next/navigation'
import { eliminarRegistro } from './actions'

const BTN: React.CSSProperties = {
  border: 'none', cursor: 'pointer', borderRadius: 6, fontWeight: 600,
  fontSize: 12, padding: '4px 10px', transition: 'opacity .15s',
}

export function RegistroRowActions({ id }: { id: number }) {
  const router = useRouter()

  async function handleDelete() {
    if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return
    await eliminarRegistro(id)
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <a
        href={`/admin/registros/${id}`}
        style={{ ...BTN, background: '#f0f4f2', color: '#4B766B', textDecoration: 'none' }}
      >
        Ver →
      </a>
      <button
        onClick={handleDelete}
        style={{ ...BTN, background: '#fff1f1', color: '#dc2626' }}
      >
        Eliminar
      </button>
    </div>
  )
}
