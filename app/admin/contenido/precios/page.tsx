import { getPrecios, getMinNights } from '../actions'
import PreciosClient from '@/components/PreciosClient'

export default async function PreciosPage() {
  const [precios, minNights] = await Promise.all([
    getPrecios().catch(() => []),
    getMinNights().catch(() => []),
  ])
  return <PreciosClient precios={precios} minNights={minNights} />
}
