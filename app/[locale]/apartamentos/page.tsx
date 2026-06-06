import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApartments } from '@/lib/db';
import { getAvailability } from '@/app/actions/availability';
import ClearDatesLink from '@/components/ClearDatesLink';

export const metadata: Metadata = {
  title: 'Nuestros Apartamentos · HolaMarbella',
  description: 'Descubre los 5 apartamentos de HolaMarbella en Marbella. Centro, Casco Antiguo y primera línea de playa.',
};

export default async function ApartamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; apt?: string; flex?: string; flexIn?: string; flexOut?: string }>
}) {
  const { checkIn, checkOut, apt, flex: flexParam, flexIn: flexInParam, flexOut: flexOutParam } = await searchParams
  const t = await getTranslations('apartmentsPage')
  const locale = await getLocale()
  // Support both legacy ?flex= and new per-date ?flexIn=&flexOut= params
  const flexIn = Math.min(7, Math.max(0, Number(flexInParam ?? flexParam) || 0))
  const flexOut = Math.min(7, Math.max(0, Number(flexOutParam ?? flexParam) || 0))
  const flex = Math.max(flexIn, flexOut)
  const apartments = await getApartments(locale)

  const hasDates = !!(checkIn && checkOut && checkIn < checkOut)
  let availability: Record<string, boolean> | null = null
  if (hasDates) {
    try {
      availability = await getAvailability(checkIn!, checkOut!, flex)
    } catch {
      // availability stays null — page renders without availability badges
    }
  }

  const filteredApts = apt
    ? apartments.filter(a => a.slug === apt)
    : apartments

  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      <div className="py-16 text-center" style={{ backgroundColor: 'var(--arena)' }}>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--on-surface-variant)' }}>
          {t('eyebrow')}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          {t('title1')}{' '}
          <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>{t('titleItalic')}</span>
        </h1>
        {hasDates ? (
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
            {t('availabilityFor')}{' '}
            <strong style={{ color: 'var(--primary)' }}>{fmtDate(checkIn!)} → {fmtDate(checkOut!)}</strong>
            {(flexIn > 0 || flexOut > 0) && (
              <span style={{ color: 'var(--on-surface-variant)' }}>
                {flexIn === flexOut
                  ? t('flexBoth', { days: flex })
                  : t('flexSplit', { in: flexIn, out: flexOut })}
              </span>
            )}
          </p>
        ) : (
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
            {t('subtitle')}
          </p>
        )}
        {hasDates && (
          <Link href="/apartamentos" className="inline-block mt-4 text-sm underline underline-offset-4" style={{ color: 'var(--primary)' }}>
            {t('clearFilter')}
          </Link>
        )}
      </div>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredApts.map((apt) => {
            const isAvailable = availability ? availability[apt.slug] : null
            return (
              <Link key={apt.slug} href={`/apartamentos/${apt.slug}${hasDates ? `?checkin=${checkIn}&checkout=${checkOut}` : ''}`} className="group block">
                <div
                  className="rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300"
                  style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={apt.primaryPhotoUrl ?? `/images/${apt.slug}/${apt.slug}-1.jpg`}
                      alt={apt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      style={isAvailable === false ? { filter: 'grayscale(1)' } : undefined}
                    />
                    {isAvailable === false && (
                      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    )}
                    {isAvailable !== null && (
                      <span
                        className="absolute bottom-3 right-3 text-xs font-bold px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: isAvailable ? '#d1fae5' : '#f3f4f6',
                          color: isAvailable ? '#065f46' : '#6b7280',
                          border: `1px solid ${isAvailable ? '#6ee7b7' : '#d1d5db'}`,
                        }}
                      >
                        {isAvailable ? t('available') : t('notAvailable')}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-400 text-sm">★</span>
                      <span className="text-sm font-semibold" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface)' }}>
                        {apt.rating.toFixed(2)}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                        ({apt.reviewCount} {t('reviews')})
                      </span>
                    </div>
                    <h3 className="text-base font-bold leading-snug mb-0.5" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--primary)' }}>
                      {apt.title}
                    </h3>
                    <p className="text-xs mb-2" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface-variant)' }}>
                      {apt.subtitle}
                    </p>
                    <p className="text-xs mb-3" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface-variant)' }}>
                      {apt.key_features}
                    </p>
                    {isAvailable === false && <ClearDatesLink />}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface-variant)' }}>
                        {t('from')}{' '}
                        <span className="font-bold text-base" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--primary)' }}>
                          {apt.priceRange[0]}€
                        </span>
                        {' '}{t('perNightShort')}
                      </span>
                      <span
                        className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all group-hover:text-white"
                        style={{ borderColor: isAvailable === false ? '#d1d5db' : 'var(--primary)', color: isAvailable === false ? '#9ca3af' : 'var(--primary)' }}
                      >
                        {t('viewShort')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
