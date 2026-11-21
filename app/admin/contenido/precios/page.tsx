import { getPrecios, getMinNights, getDescuentosVolumen } from '../actions'
import PreciosClient from '@/components/PreciosClient'
import { getApartmentRefs } from '@/lib/apartment-names'
import IvaConfig from '@/components/IvaConfig'
import { getVatParams } from '@/lib/db'

export default async function PreciosPage() {
  const [precios, minNights, descuentos, apartments, vatParams] = await Promise.all([
    getPrecios().catch(() => []),
    getMinNights().catch(() => []),
    getDescuentosVolumen().catch(() => []),
    getApartmentRefs(),
    getVatParams(),
  ])
  return (
    <>
      <IvaConfig initial={vatParams} />
      <PreciosClient precios={precios} minNights={minNights} descuentos={descuentos} apartments={apartments} />
    </>
  )
}
