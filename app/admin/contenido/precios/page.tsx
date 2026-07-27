import { getPrecios, getMinNights, getDescuentosVolumen } from '../actions'
import PreciosClient from '@/components/PreciosClient'

export default async function PreciosPage() {
  const [precios, minNights, descuentos] = await Promise.all([
    getPrecios().catch(() => []),
    getMinNights().catch(() => []),
    getDescuentosVolumen().catch(() => []),
  ])
  return <PreciosClient precios={precios} minNights={minNights} descuentos={descuentos} />
}
