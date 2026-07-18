'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { CheckCircle2, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function fmtDate(d: string, locale: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ConfirmacionContent() {
  const t = useTranslations('confirmacion');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '';
  const slug = searchParams.get('apartment') || '';
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
    ...(aptName ? [[t('apartment'), aptName] as [string, string]] : []),
    ...(ref ? [[t('reference'), ref] as [string, string]] : []),
    ...(checkin ? [[t('checkIn'), fmtDate(checkin, locale)] as [string, string]] : []),
    ...(checkout ? [[t('checkOut'), fmtDate(checkout, locale)] as [string, string]] : []),
    ...(personas ? [[t('guests'), t('guestsCount', { count: Number(personas) })] as [string, string]] : []),
    ...(breakdown.length > 0
      ? breakdown.map(g => [t('lodging', { count: g.count }), `${g.price}€ × ${g.count} = ${g.price * g.count}€`] as [string, string])
      : nights ? [[t('duration'), t('nights', { count: Number(nights) })] as [string, string]] : []
    ),
    ...(cleaning ? [[t('cleaning'), `${cleaning}€`] as [string, string]] : []),
    ...(total ? [[t('totalEstimate'), `${total}€`] as [string, string]] : []),
  ];

  return (
    <main className="max-w-2xl mx-auto px-6 md:px-8 py-24 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--arena)' }}>
          <CheckCircle2 size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--primary)' }}>
        {t('sent', { name: name ? `, ${name}` : '' })}
      </h1>

      <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>
        {t('sentSimple')}
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
          {t('priceNote')}
        </p>
      )}

      <p className="text-base leading-relaxed mb-10" style={{ color: 'var(--on-surface)' }}>
        {t('willContact')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          <Home size={16} /> {t('backHome')}
        </Link>
        <Link
          href="/apartamentos"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface-variant)' }}
        >
          {t('otherApartments')}
        </Link>
      </div>
    </main>
  );
}
