import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import RegistroViajerosForm from '@/components/RegistroViajerosForm'

export const dynamic = 'force-dynamic'

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

      <main className="max-w-3xl mx-auto px-8 py-16">
        <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface)' }}>
          {t.rich('intro', { b: (chunks) => <strong>{chunks}</strong> })}
        </p>
        <RegistroViajerosForm />
      </main>

      <Footer />
    </div>
  )
}
