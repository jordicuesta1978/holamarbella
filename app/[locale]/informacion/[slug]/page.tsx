import { notFound, permanentRedirect } from 'next/navigation'
import { findArticulo, guiaPath, articleSlug } from '@/lib/guia'

export const dynamic = 'force-dynamic'

// Ruta antigua: /informacion/<slug> → /guia-local/<slug> o /local-guide/<slug_en> (301)
export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const a = await findArticulo(slug)
  if (!a) notFound()
  permanentRedirect(guiaPath(locale, articleSlug(a, locale)))
}
