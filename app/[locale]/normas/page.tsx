import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Clock, Users, Ban, Volume2, Cigarette, Camera, Check, ShieldCheck } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('normas')
  return {
    title: `${t('title')} · HolaMarbella`,
    description: t('subtitle'),
  }
}

export default async function NormasPage() {
  const t = await getTranslations('normas')

  const sections = [
    {
      title: t('checkInTitle'),
      items: [
        { Icon: Clock, text: t('checkIn') },
        { Icon: Clock, text: t('checkOut') },
      ],
    },
    {
      title: t('coexistTitle'),
      items: [
        { Icon: Users, text: t('maxGuests') },
        { Icon: Ban, text: t('noParties') },
        { Icon: Volume2, text: t('quietHours') },
        { Icon: Cigarette, text: t('noSmoking') },
        { Icon: Ban, text: t('noPets') },
      ],
    },
    {
      title: t('careTitle'),
      items: [
        { Icon: Check, text: t('care1') },
        { Icon: ShieldCheck, text: t('care2') },
        { Icon: Camera, text: t('care3') },
      ],
    },
  ]

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

      <main className="max-w-3xl mx-auto px-8 py-16 space-y-12">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--on-surface-variant)' }}>
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--arena)' }}>
                    <Icon size={18} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
                  </div>
                  <span className="text-base" style={{ color: 'var(--on-surface)' }}>{text}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <Footer />
    </div>
  )
}
