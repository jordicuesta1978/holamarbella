'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/admin'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', borderRadius: 16, padding: '40px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-block', background: '#4B766B', color: '#fff', borderRadius: 12, padding: '8px 16px', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            HolaMarbella
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>Panel de administración</p>
        </div>

        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Email</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', color: '#1a1a2e' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Contraseña</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', color: '#1a1a2e' }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: '#e53e3e', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            style={{ background: '#4B766B', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', opacity: pending ? 0.6 : 1, marginTop: 4 }}
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
