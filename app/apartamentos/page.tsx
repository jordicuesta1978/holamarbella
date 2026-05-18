import Link from 'next/link';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { apartments } from '@/lib/apartments';

export const metadata: Metadata = {
  title: 'Nuestros Apartamentos · HolaMarbella',
  description: 'Descubre los 5 apartamentos de HolaMarbella en Marbella. Centro, Casco Antiguo y primera línea de playa.',
};

export default function ApartamentosPage() {
  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      {/* Page header */}
      <div className="py-16 text-center" style={{ backgroundColor: 'var(--arena)' }}>
        <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: 'var(--on-surface-variant)' }}>
          Marbella · España
        </p>
        <h1 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--primary)' }}>
          Nuestros{' '}
          <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>Apartamentos</span>
        </h1>
        <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: 'var(--on-surface-variant)' }}>
          5 apartamentos únicos en el corazón de Marbella, gestionados con mimo por Mar.
        </p>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apartments.map((apt) => (
            <Link key={apt.slug} href={`/apartamentos/${apt.slug}`} className="group block">
              <div
                className="rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300"
                style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
              >
                {/* Photo */}
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={`/images/${apt.slug}/${apt.slug}-1.jpg`}
                    alt={apt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {apt.badge && (
                    <span
                      className="absolute top-3 left-3 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {apt.badge}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                      {apt.rating.toFixed(2)}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      ({apt.reviewCount} reseñas)
                    </span>
                  </div>
                  <h2 className="text-base font-bold leading-snug mb-1" style={{ color: 'var(--on-surface)' }}>
                    {apt.title}
                  </h2>
                  <p className="text-sm mb-3" style={{ color: 'var(--on-surface-variant)' }}>
                    {apt.capacity.persons} personas · {apt.capacity.bedrooms} dorm · {apt.capacity.bathrooms} baño
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>
                      Desde{' '}
                      <span className="font-bold text-base" style={{ color: 'var(--primary)' }}>
                        {apt.priceRange[0]}€
                      </span>
                      {' '}/noche
                    </span>
                    <span
                      className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all group-hover:text-white"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      Ver →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
