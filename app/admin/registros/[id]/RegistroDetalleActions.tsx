'use client'

import { useRouter } from 'next/navigation'
import { marcarVerificado, eliminarRegistro } from '../actions'

const BTN: React.CSSProperties = {
  border: 'none', cursor: 'pointer', borderRadius: 8, fontWeight: 700,
  fontSize: 13, padding: '10px 20px', transition: 'opacity .15s',
}

export function RegistroDetalleActions({
  id,
  verificado,
}: {
  id: number
  verificado: boolean
}) {
  const router = useRouter()

  async function handleVerificar() {
    await marcarVerificado(id)
    router.refresh()
  }

  async function handleEliminar() {
    if (!window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return
    await eliminarRegistro(id)
    // redirect happens server-side inside eliminarRegistro
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {!verificado && (
        <button
          onClick={handleVerificar}
          style={{ ...BTN, background: '#4B766B', color: '#fff' }}
        >
          ✓ Marcar como enviado a policía
        </button>
      )}
      <button
        onClick={handleEliminar}
        style={{ ...BTN, background: '#fff1f1', color: '#dc2626', border: '1px solid #fecaca' }}
      >
        Eliminar registro
      </button>
    </div>
  )
}
