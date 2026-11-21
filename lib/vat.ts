// HMB-001 — IVA en estancias de corta temporada.
// Módulo puro (sin acceso a BD) para poder usarlo tanto en servidor como en
// el formulario del cliente. Los parámetros se leen de la tabla `parametros`
// (ver getVatParams en lib/db.ts).

export type VatParams = { rate: number; maxNights: number }

export const DEFAULT_VAT_PARAMS: VatParams = { rate: 10, maxNights: 30 }

export type VatResult = { rate: number; amount: number }

// El IVA se aplica solo al alojamiento (precio por noche × noches, ya con los
// descuentos de volumen restados). Limpieza y extras quedan fuera.
// Estancias de más de `maxNights` noches: sin IVA.
// Euros enteros, igual que el resto de importes de la web.
export function computeVat(lodgingBase: number, nights: number, params: VatParams = DEFAULT_VAT_PARAMS): VatResult {
  if (nights <= 0 || nights > params.maxNights || params.rate <= 0 || lodgingBase <= 0) {
    return { rate: 0, amount: 0 }
  }
  return { rate: params.rate, amount: Math.round(lodgingBase * params.rate / 100) }
}

export function vatLabel(rate: number, locale: 'es' | 'en' = 'es'): string {
  return locale === 'en' ? `VAT ${rate}% (accommodation)` : `IVA ${rate}% (alojamiento)`
}
