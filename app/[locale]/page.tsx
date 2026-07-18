import { getLocale } from 'next-intl/server'
import { getApartments, getGlobalBlockedDates } from '@/lib/db'
import { getFeaturedResenas } from '@/app/admin/contenido/actions'
import HomeClient from '@/components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const locale = await getLocale()
  const [apartments, globalBlockedDates, featuredReviews] = await Promise.all([
    getApartments(locale),
    getGlobalBlockedDates().catch(() => []),
    getFeaturedResenas().catch(() => []),
  ])
  return <HomeClient apartments={apartments} globalBlockedDates={globalBlockedDates} featuredReviews={featuredReviews} />
}
