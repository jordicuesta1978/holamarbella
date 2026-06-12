import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Información y Consejos · HolaMarbella',
  description: 'Guías, consejos y artículos sobre Marbella. Todo lo que necesitas saber para disfrutar al máximo tu estancia.',
}

interface Articulo {
  id: number
  titulo: string
  titulo_en?: string | null
  slug: string
  contenido: string
  imagen_url: string | null
  hero_image?: string | null
  categoria?: string | null
  categoria_en?: string | null
  extracto?: string | null
  extracto_en?: string | null
  created_at: string
}

async function getPublishedArticulos(): Promise<Articulo[]> {
  const { data } = await (supabase as any)
    .from('articulos')
    .select('id, titulo, titulo_en, slug, contenido, imagen_url, hero_image, categoria, categoria_en, extracto, extracto_en, created_at')
    .eq('publicado', true)
    .order('created_at', { ascending: false })
  return (data ?? []) as Articulo[]
}

function fmtDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

function plainExcerpt(html: string, maxLen = 160) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}

export default async function InformacionPage() {
  const [articulos, t, locale] = await Promise.all([
    getPublishedArticulos(),
    getTranslations('informacion'),
    getLocale(),
  ])

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      <div className="py-16 text-center" style={{ backgroundColor: 'var(--arena)' }}>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--on-surface-variant)' }}>
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          {t('heroTitle')}{' '}
          <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>{t('heroTitleItalic')}</span>
        </h1>
        <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
          {t('heroSubtitle')}
        </p>
      </div>

      <main className="max-w-5xl mx-auto px-8 py-16">
        {articulos.length === 0 ? (
          <div className="text-center py-24" style={{ color: 'var(--on-surface-variant)' }}>
            <p className="text-lg">{t('empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articulos.map((a) => {
              const titulo = (locale === 'en' && a.titulo_en) ? a.titulo_en : a.titulo
              const categoria = (locale === 'en' && a.categoria_en) ? a.categoria_en : (a.categoria ?? null)
              const extracto = (locale === 'en' && a.extracto_en)
                ? a.extracto_en
                : (a.extracto ?? plainExcerpt(a.contenido))
              const img = a.hero_image ?? a.imagen_url ?? null

              return (
                <Link
                  key={a.id}
                  href={`/${locale}/informacion/${a.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <article
                    className="rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow duration-300"
                    style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white', cursor: 'pointer', height: '100%' }}
                  >
                    {/* Image */}
                    {img ? (
                      <div className="aspect-[16/9] overflow-hidden" style={{ position: 'relative' }}>
                        <img
                          src={img}
                          alt={titulo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                        {/* Category badge over image */}
                        {categoria && (
                          <span style={{
                            position: 'absolute',
                            top: 12,
                            left: 14,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: '#fff',
                            background: '#e07b5a',
                            borderRadius: 6,
                            padding: '3px 10px',
                          }}>
                            {categoria}
                          </span>
                        )}
                      </div>
                    ) : categoria ? (
                      <div style={{ padding: '14px 20px 0' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: '#e07b5a',
                        }}>
                          {categoria}
                        </span>
                      </div>
                    ) : null}

                    <div className="p-6" style={{ paddingTop: img ? undefined : (categoria ? 8 : undefined) }}>
                      {/* Category below title when no image */}
                      {!img && !categoria && null}

                      <time className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                        {fmtDate(a.created_at, locale)}
                      </time>
                      <h2 className="text-xl font-bold mt-2 mb-3 leading-snug" style={{ color: 'var(--primary)' }}>
                        {titulo}
                      </h2>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                        {extracto}
                      </p>
                      <p style={{ marginTop: 14, fontSize: 13, fontWeight: 700, color: '#4B766B' }}>
                        {t('readMore')}
                      </p>
                    </div>
                  </article>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
