import { getApartments, getGlobalBlockedDates } from '@/lib/db'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [apartments, globalBlockedDates] = await Promise.all([
    getApartments(),
    getGlobalBlockedDates().catch(() => []),
  ])
  return <HomeClient apartments={apartments} globalBlockedDates={globalBlockedDates} />
}
