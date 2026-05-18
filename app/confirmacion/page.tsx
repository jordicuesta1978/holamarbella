"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Mail, Home, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApartment } from '@/lib/apartments';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const slug = searchParams.get('apartment') || '';
  const apartment = slug ? getApartment(slug) : null;

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-8 py-24 text-center">
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--arena)' }}>
          <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
        ¡Solicitud enviada
        {name ? `, ${name}` : ''}!
      </h1>

      <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>
        Tu solicitud ha sido enviada correctamente.{' '}
        <strong style={{ color: 'var(--on-surface)' }}>Mar la revisará y se pondrá en contacto contigo pronto</strong>{' '}
        por email con el resultado.
      </p>

      {/* Apartment recap */}
      {apartment && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border mb-8 text-left"
          style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
        >
          <img
            src={`/images/${slug}/${slug}-1.jpg`}
            alt={apartment.title}
            className="w-16 h-16 object-cover rounded-xl shrink-0"
          />
          <div>
            <p className="font-bold text-sm leading-snug" style={{ color: 'var(--on-surface)' }}>
              {apartment.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              {apartment.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* What happens next */}
      <div
        className="rounded-2xl p-6 text-left mb-8"
        style={{ backgroundColor: 'var(--arena)' }}
      >
        <h2 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>
          ¿Qué pasa ahora?
        </h2>
        <ol className="space-y-3">
          {[
            { Icon: Mail, text: 'Recibirás un email de confirmación con el resumen de tu solicitud.' },
            { Icon: CheckCircle2, text: 'Mar revisará tu petición y te responderá en menos de 24h.' },
            { Icon: ArrowRight, text: 'Si es aprobada, recibirás los detalles finales para completar la reserva.' },
          ].map(({ Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface)' }}>{text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Note about check-in */}
      <p className="text-sm mb-10" style={{ color: 'var(--on-surface-variant)' }}>
        El check-in siempre se hace en persona con Mar. Nunca recibirás instrucciones automáticas de acceso.
      </p>

      {/* Links */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <Home size={16} /> Volver al inicio
        </Link>
        <Link
          href="/apartamentos"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Ver otros apartamentos <ArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}

export default function ConfirmacionPage() {
  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-8 py-32 text-center" style={{ color: 'var(--on-surface-variant)' }}>
          Cargando...
        </div>
      }>
        <ConfirmacionContent />
      </Suspense>
      <Footer />
    </div>
  );
}
