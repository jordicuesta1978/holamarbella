import { getApartments } from '@/lib/db'
import HomeClient from '@/components/HomeClient'

export default async function Home() {
  const apartments = await getApartments()
  return <HomeClient apartments={apartments} />
}
