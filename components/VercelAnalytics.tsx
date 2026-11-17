'use client'

import { Analytics } from '@vercel/analytics/next'

// Vercel Web Analytics con filtro de privacidad:
// - No cuenta las visitas al panel de administración.
// - Oculta el token de los enlaces únicos de huéspedes (/conversacion/[token]).
// - Elimina todos los parámetros de la URL (?token=, ?email=, fechas, etc.).
export default function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url)
        if (url.pathname.startsWith('/admin')) return null
        url.pathname = url.pathname.replace(/^\/conversacion\/[^/]+/, '/conversacion/[token]')
        url.search = ''
        url.hash = ''
        return { ...event, url: url.toString() }
      }}
    />
  )
}
