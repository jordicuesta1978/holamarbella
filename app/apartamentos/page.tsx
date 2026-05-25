import Link from 'next/link';
import type { Metadata } from 'next';
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
  searchParams: Promise<{ checkIn?: string; checkOut?: string; apt?: string; flex?: string }>
}) {
  const { checkIn, checkOut, apt, flex: flexParam } = await searchParams
  const flex = Math.min(7, Math.max(0, Number(flexParam) || 0))
  const apartments = await getApartments()

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
    return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      <div className="py-16 text-center" style={{ backgroundColor: 'var(--arena)' }}>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--on-surface-variant)' }}>
          Marbella · España
        </p>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          Nuestros{' '}
          <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>Apartamentos</span>
        </h1>
        {hasDates ? (
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
            Disponibilidad para{' '}
            <strong style={{ color: 'var(--primary)' }}>{fmtDate(checkIn!)} → {fmtDate(checkOut!)}</strong>
            {flex > 0 && <span style={{ color: 'var(--on-surface-variant)' }}>{' '}(±{flex} día{flex > 1 ? 's' : ''} de flexibilidad)</span>}
          </p>
        ) : (
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
            5 apartamentos únicos en el corazón de Marbella, gestionados con mimo.
          </p>
        )}
        {hasDates && (
          <Link href="/apartamentos" className="inline-block mt-4 text-sm underline underline-offset-4" style={{ color: 'var(--primary)' }}>
            ← Ver todos sin filtro de fechas
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
                      src={`/images/${apt.slug}/${apt.slug}-1.jpg`}
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
                        {isAvailable ? '✓ Disponible' : 'No disponible en estas fechas'}
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
                        ({apt.reviewCount} reseñas)
                      </span>
                    </div>
                    <h2 className="text-base font-bold leading-snug mb-0.5" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface)' }}>
                      Apartamento {apt.title.split(' · ')[0]}
                    </h2>
                    <p className="text-xs mb-2" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface-variant)' }}>
                      {apt.subtitle}
                    </p>
                    <p className="text-sm mb-3" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface-variant)' }}>
                      {apt.capacity.persons} personas · {apt.capacity.bedrooms} dorm · {apt.capacity.bathrooms} baño
                    </p>
                    {isAvailable === false && <ClearDatesLink />}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--on-surface-variant)' }}>
                        Desde{' '}
                        <span className="font-bold text-base" style={{ color: isAvailable === false ? '#9ca3af' : 'var(--primary)' }}>
                          {apt.priceRange[0]}€
                        </span>
                        {' '}/noche
                      </span>
                      <span
                        className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all group-hover:text-white"
                        style={{ borderColor: isAvailable === false ? '#d1d5db' : 'var(--primary)', color: isAvailable === false ? '#9ca3af' : 'var(--primary)' }}
                      >
                        Ver →
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
