"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Home, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const slug = searchParams.get('apartment') || '';
  const token = searchParams.get('token') || '';
  const ref = searchParams.get('ref') || '';
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const personas = searchParams.get('personas') || '';
  const nights = searchParams.get('nights') || '';
  const cleaning = searchParams.get('cleaning') || '';
  const total = searchParams.get('total') || '';
  const breakdownRaw = searchParams.get('breakdown') || '';
  const breakdown: Array<{ price: number; count: number }> = (() => {
    try { return breakdownRaw ? JSON.parse(breakdownRaw) : [] } catch { return [] }
  })();

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

  const aptName = aptInfo?.title || '';

  const details: [string, string][] = [
    ...(aptName ? [['Apartamento', aptName] as [string, string]] : []),
    ...(ref ? [['Referencia', ref] as [string, string]] : []),
    ...(checkin ? [['Llegada', fmtDate(checkin)] as [string, string]] : []),
    ...(checkout ? [['Salida', fmtDate(checkout)] as [string, string]] : []),
    ...(personas ? [['Personas', `${personas} persona${Number(personas) > 1 ? 's' : ''}`] as [string, string]] : []),
    ...(breakdown.length > 0
      ? breakdown.map(g => [`Alojamiento (${g.count} noche${g.count > 1 ? 's' : ''})`, `${g.price}€ × ${g.count} = ${g.price * g.count}€`] as [string, string])
      : nights ? [['Duración', `${nights} noche${Number(nights) > 1 ? 's' : ''}`] as [string, string]] : []
    ),
    ...(cleaning ? [['Gastos de limpieza', `${cleaning}€`] as [string, string]] : []),
    ...(total ? [['Total estimado', `${total}€`] as [string, string]] : []),
  ];

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
        Tu solicitud ha sido enviada correctamente.
      </p>

      {details.length > 0 && (
        <div className="rounded-2xl border mb-8 overflow-hidden text-left" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
          {details.map(([label, value], i) => (
            <div key={label} className="flex" style={{ borderTop: i > 0 ? '1px solid var(--outline-variant)' : undefined }}>
              <div
                className="px-5 py-3 text-xs font-bold uppercase tracking-wider"
                style={{ width: '38%', backgroundColor: 'var(--arena)', color: '#888' }}
              >
                {label}
              </div>
              <div className="flex-1 px-5 py-3 text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {(total || breakdown.length > 0) && (
        <p className="text-xs mb-6 text-center" style={{ color: 'var(--on-surface-variant)' }}>
          * El precio exacto será confirmado al revisar tu solicitud.
        </p>
      )}

      <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--on-surface)' }}>
        Revisaremos tu petición y nos pondremos en contacto contigo lo antes posible.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {token && (
          <Link
            href={`/conversacion/${token}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Ver mi reserva <ArrowRight size={16} />
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <Home size={16} /> Volver al inicio
        </Link>
        <Link
          href="/apartamentos"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
        >
          Ver otros apartamentos
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
