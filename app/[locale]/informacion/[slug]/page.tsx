import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Articulo {
  id: number
  titulo: string
  titulo_en?: string | null
  slug: string
  contenido: string
  contenido_en?: string | null
  categoria?: string | null
  categoria_en?: string | null
  extracto?: string | null
  extracto_en?: string | null
  imagen_url?: string | null
  hero_image?: string | null
  created_at: string
}

async function getArticuloBySlug(slug: string): Promise<Articulo | null> {
  const { data } = await (supabase as any)
    .from('articulos')
    .select('*')
    .eq('slug', slug)
    .eq('publicado', true)
    .single()
  return data ?? null
}

function fmtDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { slug, locale } = await params
  const a = await getArticuloBySlug(slug)
  if (!a) return {}
  const titulo = (locale === 'en' && a.titulo_en) ? a.titulo_en : a.titulo
  const extracto = (locale === 'en' && a.extracto_en) ? a.extracto_en : (a.extracto ?? a.contenido.slice(0, 160))
  return {
    title: `${titulo} · HolaMarbella`,
    description: extracto.slice(0, 160),
  }
}

export default async function ArticuloPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { slug } = await params
  const locale = await getLocale()
  const a = await getArticuloBySlug(slug)
  if (!a) notFound()

  const titulo = (locale === 'en' && a.titulo_en) ? a.titulo_en : a.titulo
  const contenido = (locale === 'en' && a.contenido_en) ? a.contenido_en : a.contenido
  const categoria = (locale === 'en' && a.categoria_en) ? a.categoria_en : (a.categoria ?? null)
  const heroImg = a.hero_image ?? a.imagen_url ?? null

  // Split first paragraph for the intro callout
  const isHtml = contenido.trimStart().startsWith('<')
  let introHtml = ''
  let restHtml = contenido

  if (isHtml) {
    const firstPMatch = contenido.match(/^(<p[^>]*>[\s\S]*?<\/p>)([\s\S]*)$/i)
    if (firstPMatch) {
      introHtml = firstPMatch[1]
      restHtml = firstPMatch[2]
    }
  } else {
    const lines = contenido.split('\n\n')
    if (lines.length > 1) {
      introHtml = `<p>${lines[0]}</p>`
      restHtml = lines.slice(1).map(l => `<p>${l}</p>`).join('\n')
    } else {
      introHtml = `<p>${contenido}</p>`
      restHtml = ''
    }
  }

  return (
    <div style={{ backgroundColor: '#fdf9f4', color: '#1a1a2e' }}>
      <Header />

      {/* Hero */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 480,
          overflow: 'hidden',
          backgroundColor: '#2d2d2d',
        }}
      >
        {heroImg && (
          <img
            src={heroImg}
            alt={titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.10) 100%)',
          }}
        />
        {/* Title block over image */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0 clamp(24px, 6vw, 96px) 48px',
            maxWidth: 860,
            margin: '0 auto',
          }}
        >
          {categoria && (
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#e07b5a',
                marginBottom: 10,
                margin: '0 0 10px 0',
              }}
            >
              {categoria}
            </p>
          )}
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 48px)',
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {titulo}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 14, margin: '14px 0 0 0' }}>
            {fmtDate(a.created_at, locale)}
          </p>
        </div>
      </div>

      {/* Article body */}
      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '56px clamp(20px, 5vw, 40px) 80px',
        }}
      >
        {/* Intro paragraph — with left accent border */}
        {introHtml && (
          <div
            dangerouslySetInnerHTML={{ __html: introHtml }}
            style={{
              borderLeft: '3px solid #e07b5a',
              paddingLeft: 20,
              marginBottom: 36,
              fontSize: 18,
              lineHeight: 1.75,
              color: '#2d2d2d',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          />
        )}

        {/* Rest of content */}
        {restHtml && (
          <div
            dangerouslySetInnerHTML={{ __html: restHtml }}
            className="article-body"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: 17,
              lineHeight: 1.8,
              color: '#2d2d2d',
            }}
          />
        )}
      </main>

      {/* Article body styles */}
      <style>{`
        .article-body h2 {
          font-size: 22px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 48px 0 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e8e0d5;
          font-family: Georgia, "Times New Roman", serif;
        }
        .article-body h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 32px 0 10px;
          font-family: Georgia, "Times New Roman", serif;
        }
        .article-body p {
          margin: 0 0 22px;
        }
        .article-body ul,
        .article-body ol {
          padding-left: 24px;
          margin: 0 0 22px;
        }
        .article-body li {
          margin-bottom: 8px;
        }
        .article-body strong { color: #1a1a2e; }
        .article-body em { color: #555; }
        .article-body blockquote {
          background: #fff8f0;
          border: 1px solid #f0e4d4;
          border-radius: 10px;
          padding: 20px 24px;
          margin: 28px 0;
          font-style: italic;
          color: #5a4a3a;
        }
        .article-body img {
          width: 100%;
          border-radius: 10px;
          margin: 24px 0;
        }
        .article-body a {
          color: #4B766B;
          text-decoration: underline;
        }
      `}</style>

      <Footer />
    </div>
  )
}
