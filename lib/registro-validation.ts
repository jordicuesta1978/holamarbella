// Validación compartida (cliente + servidor) del formulario de registro de viajeros.
// El servidor la vuelve a ejecutar siempre: la del cliente es solo para dar feedback.

export type RegistroFields = {
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
  numViajeros: number | string
  parentesco?: string
}

export type FieldError = 'required' | 'invalid'

export type ValidationResult = {
  errors: Partial<Record<keyof RegistroFields, FieldError>>
  /** true si algún campo parece texto aleatorio generado por un bot */
  suspicious: boolean
}

const NAME_RE = /^[\p{L}\p{M}' .\-]{1,60}$/u
const PLACE_RE = /^[\p{L}\p{M}' .,\-()/]{2,60}$/u
const POSTAL_RE = /^[A-Za-z0-9 \-]{3,10}$/
const DOC_RE = /^[A-Za-z0-9.\- ]{5,20}$/
const SOPORTE_RE = /^[A-Za-z0-9]{6,12}$/
const PHONE_RE = /^\+?[0-9 ()\-.]{6,20}$/
const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[A-Za-z]{2,}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

/** DNI español (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra) con letra de control correcta */
function isValidSpanishId(raw: string): boolean {
  const v = raw.toUpperCase().replace(/[\s.\-]/g, '')
  let digits: string
  if (/^\d{8}[A-Z]$/.test(v)) digits = v.slice(0, 8)
  else if (/^[XYZ]\d{7}[A-Z]$/.test(v)) digits = String('XYZ'.indexOf(v[0])) + v.slice(1, 8)
  else return false
  return DNI_LETTERS[Number(digits) % 23] === v[8]
}

function looksLikeSpanishId(raw: string): boolean {
  const v = raw.toUpperCase().replace(/[\s.\-]/g, '')
  return /^\d{8}[A-Z]$/.test(v) || /^[XYZ]\d{7}[A-Z]$/.test(v)
}

/**
 * Detecta cadenas tipo "LdEdPJvyIGNjKXOWseAsH": palabras largas que mezclan
 * mayúsculas y minúsculas de forma aleatoria. Nombres reales como "McDonald"
 * o direcciones en mayúsculas ("CALLE MAYOR") no disparan.
 */
export function looksRandom(s: string | undefined): boolean {
  if (!s) return false
  for (const word of s.split(/[\s,.\-/']+/)) {
    if (word.length < 10) continue
    const hasLower = /\p{Ll}/u.test(word)
    const innerUpper = (word.slice(1).match(/\p{Lu}/gu) || []).length
    if (hasLower && innerUpper >= 3) return true
  }
  return false
}

const hasDigit = (s: string) => /\d/.test(s)
const countDigits = (s: string) => (s.match(/\d/g) || []).length

export function validateRegistro(d: RegistroFields): ValidationResult {
  const errors: ValidationResult['errors'] = {}
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())

  const req = (k: keyof RegistroFields, ok: (v: string) => boolean) => {
    const v = s(d[k])
    if (!v) errors[k] = 'required'
    else if (!ok(v)) errors[k] = 'invalid'
  }
  const opt = (k: keyof RegistroFields, ok: (v: string) => boolean) => {
    const v = s(d[k])
    if (v && !ok(v)) errors[k] = 'invalid'
  }

  req('nombre', v => NAME_RE.test(v))
  req('apellidos', v => NAME_RE.test(v))
  req('sexo', v => v === 'M' || v === 'F')
  req('tipoDocumento', v => ['DNI', 'Pasaporte', 'TIE'].includes(v))

  const tipo = s(d.tipoDocumento)
  req('numeroDocumento', v => {
    if (!DOC_RE.test(v) || !hasDigit(v)) return false
    if (tipo === 'TIE') return isValidSpanishId(v)
    // Un DNI con formato español debe tener la letra correcta; un documento
    // nacional de otro país (p.ej. carta d'identità) se acepta con formato genérico.
    if (tipo === 'DNI' && looksLikeSpanishId(v)) return isValidSpanishId(v)
    return true
  })
  if (tipo === 'DNI') req('numeroSoporte', v => SOPORTE_RE.test(v) && hasDigit(v))
  else opt('numeroSoporte', v => SOPORTE_RE.test(v) && hasDigit(v))

  req('nacionalidad', v => PLACE_RE.test(v))
  req('fechaNacimiento', v => {
    if (!DATE_RE.test(v)) return false
    const t = new Date(v + 'T00:00:00Z').getTime()
    return !Number.isNaN(t) && t >= Date.UTC(1900, 0, 1) && t <= Date.now()
  })
  req('direccion', v => v.length >= 3 && v.length <= 150 && !/[<>]/.test(v))
  req('localidad', v => PLACE_RE.test(v))
  req('codigoPostal', v => POSTAL_RE.test(v))
  req('pais', v => PLACE_RE.test(v))
  req('telefonoMovil', v => PHONE_RE.test(v) && countDigits(v) >= 6)
  opt('telefonoFijo', v => PHONE_RE.test(v) && countDigits(v) >= 6)
  opt('email', v => v.length <= 120 && EMAIL_RE.test(v))

  const n = Number(s(d.numViajeros))
  if (!s(d.numViajeros)) errors.numViajeros = 'required'
  else if (!Number.isInteger(n) || n < 1 || n > 20) errors.numViajeros = 'invalid'

  opt('parentesco', v => v.length <= 120 && !/[<>]/.test(v))

  const suspicious = [
    d.nombre, d.apellidos, d.nacionalidad, d.direccion, d.localidad, d.pais, d.parentesco,
    d.numeroDocumento, d.numeroSoporte,
  ].some(v => looksRandom(typeof v === 'string' ? v : undefined))

  return { errors, suspicious }
}
