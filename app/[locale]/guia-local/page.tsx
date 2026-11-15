import { permanentRedirect } from 'next/navigation'
import GuiaIndex, { guiaIndexMetadata } from '@/components/guia/GuiaIndex'
import { guiaPath } from '@/lib/guia'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  return guiaIndexMetadata(locale)
}

export default async function Page({ params }: Props) {
  const { locale } = await params
  // Cada idioma tiene su ruta: /es/guia-local · /en/local-guide
  if (guiaPath(locale) !== `/${locale}/guia-local`) permanentRedirect(guiaPath(locale))
  return <GuiaIndex locale={locale} />
}
