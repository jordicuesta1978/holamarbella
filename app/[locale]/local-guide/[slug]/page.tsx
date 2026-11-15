import GuiaArticle, { guiaArticleMetadata } from '@/components/guia/GuiaArticle'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  return guiaArticleMetadata(locale, slug)
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params
  return <GuiaArticle locale={locale} slug={slug} section="local-guide" />
}
