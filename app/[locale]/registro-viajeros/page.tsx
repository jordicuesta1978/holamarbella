import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('registro')
  return {
    title: `${t('title')} · HolaMarbella`,
    description: t('subtitle'),
  }
}

export default async function RegistroViajerosPage() {
  const t = await getTranslations('registro')

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      <div className="py-16 text-center" style={{ backgroundColor: 'var(--arena)' }}>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          {t('title')}
        </h1>
        <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
          {t('subtitle')}
        </p>
      </div>

      <main className="max-w-2xl mx-auto px-8 py-16">
        <div
          className="rounded-2xl border p-8 md:p-10 text-center"
          style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--arena)' }}>
              <ShieldCheck size={32} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            </div>
          </div>

          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface)' }}>
            {t('info')}
          </p>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {t('contactCta')}
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
