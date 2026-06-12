'use client'

import { useActionState } from 'react'
import AdminNavServer from '@/app/admin/AdminNavServer'
import { changePassword } from '@/app/actions/admin'

const iStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.5px solid #e2e8f0', borderRadius: 10,
  padding: '10px 14px', fontSize: 14, outline: 'none', color: '#1a1a2e',
}

export default function ConfiguracionPage() {
  const [result, action, pending] = useActionState(changePassword, null)

  const isError = result?.startsWith('error:')
  const isOk = result?.startsWith('ok:')
  const message = result?.replace(/^(error|ok):/, '')

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <AdminNavServer />
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Configuración</h1>

        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>Cambiar contraseña</h2>
          </div>
          <form action={action} style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Contraseña actual
              </label>
              <input name="current" type="password" required autoComplete="current-password" style={iStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Nueva contraseña
              </label>
              <input name="next" type="password" required autoComplete="new-password" minLength={6} style={iStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Confirmar nueva contraseña
              </label>
              <input name="confirm" type="password" required autoComplete="new-password" minLength={6} style={iStyle} />
            </div>

            {message && (
              <p style={{
                margin: 0, fontSize: 13,
                color: isOk ? '#4B766B' : '#e53e3e',
                background: isOk ? '#f0f9f6' : '#fff5f5',
                border: `1px solid ${isOk ? '#c6f0e0' : '#fed7d7'}`,
                borderRadius: 8, padding: '10px 14px',
              }}>
                {isOk ? '✓ ' : '✗ '}{message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                background: '#4B766B', color: '#fff', border: 'none',
                borderRadius: 10, padding: '11px', fontSize: 14,
                fontWeight: 700, cursor: pending ? 'not-allowed' : 'pointer',
                opacity: pending ? 0.6 : 1, marginTop: 4,
              }}
            >
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
