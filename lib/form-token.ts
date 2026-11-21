import 'server-only'
import { SignJWT, jwtVerify } from 'jose'

// Token firmado que se genera al cargar la página del formulario. Sirve para
// (1) rechazar envíos que no vienen de haber cargado la página y
// (2) rechazar envíos hechos demasiado rápido (un humano tarda bastante más).

const MIN_SECONDS = 4
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? '')

export async function createFormToken(form: string): Promise<string> {
  return new SignJWT({ form })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key())
}

export async function verifyFormToken(
  token: string | undefined,
  form: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!token) return { ok: false, reason: 'sin token' }
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] })
    if (payload.form !== form) return { ok: false, reason: 'token de otro formulario' }
    const age = Date.now() / 1000 - (payload.iat ?? 0)
    if (age < MIN_SECONDS) return { ok: false, reason: `enviado en ${age.toFixed(1)}s` }
    return { ok: true }
  } catch {
    return { ok: false, reason: 'token inválido o caducado' }
  }
}

/** Verificación opcional de Cloudflare Turnstile: solo actúa si TURNSTILE_SECRET_KEY está definida. */
export async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
