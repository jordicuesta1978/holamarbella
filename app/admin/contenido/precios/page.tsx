import { getPrecios, getMinNights, getDescuentosVolumen } from '../actions'
import PreciosClient from '@/components/PreciosClient'
import { getApartmentRefs } from '@/lib/apartment-names'

export default async function PreciosPage() {
  const [precios, minNights, descuentos, apartments] = await Promise.all([
    getPrecios().catch(() => []),
    getMinNights().catch(() => []),
    getDescuentosVolumen().catch(() => []),
    getApartmentRefs(),
  ])
  return <PreciosClient precios={precios} minNights={minNights} descuentos={descuentos} apartments={apartments} />
}
