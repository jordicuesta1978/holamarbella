'use server'

import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { aptFullName } from '@/lib/apartment-names'
import { validateRegistro } from '@/lib/registro-validation'
import { verifyFormToken, verifyTurnstile } from '@/lib/form-token'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'
const MAR = process.env.MAR_EMAIL

export type RegistroInput = {
  apartmentSlug?: string
  nombre: string
  apellidos: string
  sexo: string
  tipoDocumento: string
  numeroDocumento: string
  numeroSoporte?: string
  nacionalidad: string
  fechaNacimiento: string
  direccion: string
  localidad: string
  codigoPostal: string
  pais: string
  telefonoMovil: string
  telefonoFijo?: string
  email?: string
  numViajeros: number
  parentesco?: string
}

export type RegistroMeta = {
  /** token firmado generado al cargar la página */
  formToken?: string
  /** campo trampa invisible: un humano nunca lo rellena */
  hp?: string
  /** token de Cloudflare Turnstile (solo si está configurado) */
  turnstileToken?: string
}

export type RegistroResult =
  | { ok: true }
  | { ok: false; error: 'reload' | 'invalid' | 'captcha' | 'generic'; fields?: string[] }

export async function crearRegistro(
  input: RegistroInput,
  meta: RegistroMeta = {}
): Promise<RegistroResult> {
  // 1) Campo trampa: si viene relleno es un bot. Respondemos "ok" sin guardar ni avisar.
  if (meta.hp && meta.hp.trim()) {
    console.warn('[registro] descartado: campo trampa relleno')
    return { ok: true }
  }

  // 2) Token de la página: tiene que existir, ser válido y no ser de hace < 4 s.
  const tk = await verifyFormToken(meta.formToken, 'registro')
  if (!tk.ok) {
    console.warn(`[registro] descartado: ${tk.reason}`)
    if (tk.reason.startsWith('enviado en')) return { ok: true } // demasiado rápido para un humano
    return { ok: false, error: 'reload' }
  }

  // 3) Captcha opcional (Cloudflare Turnstile)
  if (!(await verifyTurnstile(meta.turnstileToken))) {
    console.warn('[registro] descartado: turnstile')
    return { ok: false, error: 'captcha' }
  }

  // 4) Validación de formato en servidor
  const v = validateRegistro(input)
  const bad = Object.keys(v.errors)
  if (bad.length || v.suspicious) {
    console.warn(`[registro] rechazado: ${v.suspicious ? 'texto aleatorio; ' : ''}campos ${bad.join(', ')}`)
    return { ok: false, error: 'invalid', fields: bad }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseAdmin as any).from('registros_viajeros').insert({
    apartment_slug: input.apartmentSlug || null,
    nombre: input.nombre,
    apellidos: input.apellidos,
    sexo: input.sexo || null,
    tipo_documento: input.tipoDocumento,
    numero_documento: input.numeroDocumento,
    numero_soporte: input.numeroSoporte || null,
    nacionalidad: input.nacionalidad || null,
    fecha_nacimiento: input.fechaNacimiento || null,
    direccion: input.direccion || null,
    localidad: input.localidad || null,
    codigo_postal: input.codigoPostal || null,
    pais: input.pais || null,
    telefono_movil: input.telefonoMovil,
    telefono_fijo: input.telefonoFijo || null,
    email: input.email || null,
    num_viajeros: input.numViajeros || null,
    parentesco: input.parentesco || null,
  })

  if (error) {
    console.error('[registro] error al guardar:', error.message)
    return { ok: false, error: 'generic' }
  }

  // Aviso a Mar (no bloquea el éxito del registro si falla el email)
  if (MAR) {
    try {
      await resend.emails.send({
        from: FROM,
        to: MAR,
        subject: `🛂 Nuevo registro de viajero — ${oneLine(`${input.nombre} ${input.apellidos}`)}`,
        html: emailMar(input),
      })
    } catch {
      // el registro ya está guardado; ignoramos el fallo de email
    }
  }

  return { ok: true }
}

/** Escapa HTML para que nada de lo que escribe el usuario se interprete como código en el email */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function oneLine(v: string): string {
  return v.replace(/[\r\n\t]+/g, ' ').slice(0, 120)
}

function fmtDate(d: string): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function row(label: string, value: string): string {
  if (!value) return ''
  return `<tr>
    <td style="padding:10px 16px;background:#f9f7f4;width:42%;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#888;border-top:1px solid #e8e0d0;vertical-align:top;">${label}</td>
    <td style="padding:10px 16px;font-size:14px;color:#1A1A1A;line-height:1.6;border-top:1px solid #e8e0d0;">${esc(value)}</td>
  </tr>`
}

function emailMar(d: RegistroInput): string {
  const fecha = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  const apt = d.apartmentSlug ? aptFullName(d.apartmentSlug) : '—'
  const docLine = `${d.tipoDocumento} ${d.numeroDocumento}${d.numeroSoporte ? ` (soporte ${d.numeroSoporte})` : ''}`
  const residence = [d.direccion, d.codigoPostal, d.localidad, d.pais].filter(Boolean).join(', ')
  const sexoLabel = d.sexo === 'M' ? 'Masculino' : d.sexo === 'F' ? 'Femenino' : '—'

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:40px 20px;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;">
    <tr><td style="background:#4B766B;padding:28px 40px;text-align:center;">
      <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">HolaMarBella!</p>
    </td></tr>
    <tr><td style="padding:36px 40px 28px;">
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#4B766B;">Nuevo registro de viajero</h1>
      <p style="margin:0 0 24px;font-size:13px;color:#999;">${fecha}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e0d0;border-radius:10px;overflow:hidden;">
        ${row('Apartamento', apt)}
        ${row('Nombre', `${d.nombre} ${d.apellidos}`)}
        ${row('Sexo', sexoLabel)}
        ${row('Documento', docLine)}
        ${row('Nacionalidad', d.nacionalidad || '—')}
        ${row('Fecha de nacimiento', fmtDate(d.fechaNacimiento))}
        ${row('Residencia', residence || '—')}
        ${row('Teléfono móvil', d.telefonoMovil)}
        ${row('Teléfono fijo', d.telefonoFijo || '')}
        ${row('Email', d.email || '')}
        ${row('Número de viajeros', d.numViajeros ? String(d.numViajeros) : '')}
        ${row('Parentesco', d.parentesco || '')}
      </table>
    </td></tr>
    <tr><td style="background:#F5F0E8;padding:24px 40px;text-align:center;border-top:1px solid #e8e0d0;">
      <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">Registro de viajeros · RD 933/2021<br>HolaMarbella · Marbella, España</p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}
