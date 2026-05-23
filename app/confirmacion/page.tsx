"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Mail, Home, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const slug = searchParams.get('apartment') || '';

  const [aptInfo, setAptInfo] = useState<{ title: string; subtitle: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('apartments')
      .select('title, subtitle')
      .eq('slug', slug)
      .single()
      .then(({ data }) => { if (data) setAptInfo(data as { title: string; subtitle: string }); });
  }, [slug]);

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-8 py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--arena)' }}>
          <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
        ¡Solicitud enviada{name ? `, ${name}` : ''}!
      </h1>

      <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>
        Tu solicitud ha sido enviada correctamente.{' '}
        <strong style={{ color: 'var(--on-surface)' }}>La revisaremos y nos pondremos en contacto contigo lo antes posible</strong>.
      </p>

      {aptInfo && slug && (
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border mb-8 text-left"
          style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
        >
          <img
            src={`/images/${slug}/${slug}-1.jpg`}
            alt={aptInfo.title}
            className="w-16 h-16 object-cover rounded-xl shrink-0"
          />
          <div>
            <p className="font-bold text-sm leading-snug" style={{ color: 'var(--on-surface)' }}>
              {aptInfo.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
              {aptInfo.subtitle}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl p-6 text-left mb-8" style={{ backgroundColor: 'var(--arena)' }}>
        <h2 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: 'var(--primary)' }}>
          ¿Qué pasa ahora?
        </h2>
        <ol className="space-y-3">
          {[
            { Icon: Mail, text: 'Recibirás un email de confirmación con el resumen de tu solicitud.' },
            { Icon: CheckCircle2, text: 'Revisaremos tu petición y nos pondremos en contacto contigo lo antes posible.' },
          ].map(({ Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: 'var(--primary)' }}>
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface)' }}>{text}</p>
            </li>
          ))}
        </ol>
      </div>


      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
          <Home size={16} /> Volver al inicio
        </Link>
        <Link href="/apartamentos" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--primary)' }}>
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
