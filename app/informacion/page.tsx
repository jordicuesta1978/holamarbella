import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Información y Consejos · HolaMarbella',
  description: 'Guías, consejos y artículos sobre Marbella. Todo lo que necesitas saber para disfrutar al máximo tu estancia.',
}

interface Articulo {
  id: number
  titulo: string
  slug: string
  contenido: string
  imagen_url: string | null
  created_at: string
}

async function getPublishedArticulos(): Promise<Articulo[]> {
  const { data } = await supabase
    .from('articulos')
    .select('id, titulo, slug, contenido, imagen_url, created_at')
    .eq('publicado', true)
    .order('created_at', { ascending: false })
    .catch(() => ({ data: [] }))
  return (data ?? []) as Articulo[]
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function excerpt(text: string, maxLen = 180) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…'
}

export default async function InformacionPage() {
  const articulos = await getPublishedArticulos()

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      <div className="py-16 text-center" style={{ backgroundColor: 'var(--arena)' }}>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--on-surface-variant)' }}>
          Marbella · Guías y consejos
        </p>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          Todo sobre{' '}
          <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>Marbella</span>
        </h1>
        <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
          Guías, restaurantes, playas y todo lo que necesitas para disfrutar al máximo tu estancia.
        </p>
      </div>

      <main className="max-w-5xl mx-auto px-8 py-16">
        {articulos.length === 0 ? (
          <div className="text-center py-24" style={{ color: 'var(--on-surface-variant)' }}>
            <p className="text-lg">Próximamente — artículos y guías sobre Marbella.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articulos.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow duration-300"
                style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
              >
                {a.imagen_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={a.imagen_url}
                      alt={a.titulo}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  <time className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                    {fmtDate(a.created_at)}
                  </time>
                  <h2 className="text-xl font-bold mt-2 mb-3 leading-snug" style={{ color: 'var(--primary)' }}>
                    {a.titulo}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                    {excerpt(a.contenido)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
