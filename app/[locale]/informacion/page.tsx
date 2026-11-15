import { permanentRedirect } from 'next/navigation'
import { guiaPath } from '@/lib/guia'

// Ruta antigua: /informacion → Guía local (301)
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  permanentRedirect(guiaPath(locale))
}
