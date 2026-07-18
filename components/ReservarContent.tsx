'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { ChevronLeft, AlertCircle, Loader2, Calendar } from 'lucide-react';
import type { Apartment } from '@/lib/apartments';
import { crearReserva } from '@/app/actions/reservar';
import { getAvailability } from '@/app/actions/availability';

function calcNights(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function formatDate(d: string, locale: string): string {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

// Local date key — avoid toISOString() which shifts the date back in UTC+N timezones
function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr(): string {
  return toKey(new Date());
}

type FormState = {
  nombre: string;
  email: string;
  telefono: string;
  personas: number;
  checkIn: string;
  checkOut: string;
  mensaje: string;
};

type FormErrors = Partial<Record<keyof FormState | 'global', string>>;

type PriceRange = { start: string; end: string; price: number }

// Replicate CalendarPicker's range logic exactly — same function, no simplification
function calcNightlyPrices(
  checkIn: string,
  checkOut: string,
  priceRanges: PriceRange[],
  midPrice: number,
): Array<{ date: string; price: number }> {
  const nights: Array<{ date: string; price: number }> = []
  const s = new Date(checkIn + 'T00:00:00')
  const e = new Date(checkOut + 'T00:00:00')
  for (const d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const key = toKey(d)
    let range: PriceRange | undefined
    for (const p of priceRanges) {
      if (key >= p.start && key < p.end) range = p
    }
    nights.push({ date: key, price: range?.price ?? midPrice })
  }
  return nights
}

function groupBreakdown(nights: Array<{ date: string; price: number }>): Array<{ price: number; count: number }> {
  const groups: Array<{ price: number; count: number }> = []
  for (const n of nights) {
    const last = groups[groups.length - 1]
    if (last && last.price === n.price) last.count++
    else groups.push({ price: n.price, count: 1 })
  }
  return groups
}

const DEFAULT_CLEANING_FEE = 40

export default function ReservarContent({
  apartment, slug,
  priceRanges = [],
  cleaningFee = DEFAULT_CLEANING_FEE,
}: {
  apartment: Apartment
  slug: string
  priceRanges?: PriceRange[]
  cleaningFee?: number
}) {
  const t = useTranslations('reservar');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    nombre: '',
    email: '',
    telefono: '',
    personas: Math.min(apartment.capacity.persons, Math.max(1, Number(searchParams.get('persons')) || 1)),
    checkIn: searchParams.get('checkin') || '',
    checkOut: searchParams.get('checkout') || '',
    mensaje: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const nights = calcNights(form.checkIn, form.checkOut);
  const midPrice = Math.round((apartment.priceRange[0] + apartment.priceRange[1]) / 2);

  // Use exact same range logic as CalendarPicker
  const nightlyPrices = (nights > 0 && form.checkIn && form.checkOut)
    ? calcNightlyPrices(form.checkIn, form.checkOut, priceRanges, midPrice)
    : []
  const subtotal = nightlyPrices.reduce((s, n) => s + n.price, 0)
  const total = subtotal > 0 ? subtotal + cleaningFee : 0
  const breakdown = groupBreakdown(nightlyPrices)

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = field === 'personas' ? Number(e.target.value) : e.target.value;
      setForm(f => ({ ...f, [field]: val }));
      setErrors(err => ({ ...err, [field]: undefined, global: undefined }));
    };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre.trim()) e.nombre = t('nameError');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('emailError');
    if (!form.checkIn) e.checkIn = t('checkInError');
    if (!form.checkOut) e.checkOut = t('checkOutError');
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      e.checkOut = t('checkOutAfterError');
    }
    if (!form.mensaje.trim() || form.mensaje.trim().length < 10) e.mensaje = t('messageError');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const avail = await getAvailability(form.checkIn, form.checkOut);
      if (avail[slug] === false) {
        setErrors({ global: t('notAvailableError') });
        setSubmitting(false);
        return;
      }

      const result = await crearReserva({
        apartmentSlug: slug,
        apartmentTitle: apartment.title,
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        personas: form.personas,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        mensaje: form.mensaje,
        locale: locale === 'en' ? 'en' : 'es',
      });

      if (!result.ok) {
        setErrors({ global: t('submitError', { error: result.error }) });
        setSubmitting(false);
        return;
      }

      const qs = new URLSearchParams({
        apartment: slug,
        name: form.nombre.split(' ')[0],
        token: result.token,
        ref: result.bookingRef,
        checkin: form.checkIn,
        checkout: form.checkOut,
        personas: String(form.personas),
        ...(nights > 0 ? {
          nights: String(nights),
          cleaning: String(cleaningFee),
          total: String(total),
          // pass breakdown so confirmation can show per-range desglose
          breakdown: JSON.stringify(breakdown),
        } : {}),
      });
      router.push(`/confirmacion?${qs.toString()}`);
    } catch {
      setErrors({ global: t('serverError') });
      setSubmitting(false);
    }
  };

  const maxPersonas = apartment.capacity.persons;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
      <Link href={`/apartamentos/${slug}`} className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>
        <ChevronLeft size={16} />
        {t('back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

        {/* ── FORM ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>{t('title')}</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--on-surface-variant)' }}>
            {t('subtitle')}
          </p>

          {errors.global && (
            <div className="flex items-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 mb-6 text-sm text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              {errors.global}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                {t('name')} <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.nombre} onChange={set('nombre')} placeholder={t('namePlaceholder')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: errors.nombre ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
              {errors.nombre && <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"><AlertCircle size={12} />{errors.nombre}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                {t('email')} <span className="text-red-500">*</span>
              </label>
              <input type="email" value={form.email} onChange={set('email')} placeholder={t('emailPlaceholder')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: errors.email ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
              {errors.email && <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"><AlertCircle size={12} />{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                {t('phone')} <span className="text-xs font-normal" style={{ color: 'var(--on-surface-variant)' }}>{t('phoneOptional')}</span>
              </label>
              <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+34 600 000 000"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }} />
            </div>

            {/* Fechas */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                <span className="inline-flex items-center gap-1.5"><Calendar size={14} />{t('dates')} <span className="text-red-500">*</span></span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--on-surface-variant)' }}>{t('checkIn')}</p>
                  <input type="date" value={form.checkIn} onChange={set('checkIn')} min={todayStr()}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: errors.checkIn ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
                  {errors.checkIn && <p className="flex items-center gap-1.5 mt-1 text-xs text-red-500"><AlertCircle size={12} />{errors.checkIn}</p>}
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--on-surface-variant)' }}>{t('checkOut')}</p>
                  <input type="date" value={form.checkOut} onChange={set('checkOut')} min={form.checkIn || todayStr()}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: errors.checkOut ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
                  {errors.checkOut && <p className="flex items-center gap-1.5 mt-1 text-xs text-red-500"><AlertCircle size={12} />{errors.checkOut}</p>}
                </div>
              </div>
            </div>

            {/* Personas */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                {t('guests')} <span className="text-red-500">*</span>
              </label>
              <select value={form.personas} onChange={set('personas')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 cursor-pointer"
                style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}>
                {Array.from({ length: maxPersonas }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? t('guest') : t('guestsPlural')}</option>
                ))}
              </select>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                {t('message')} <span className="text-red-500">*</span>
              </label>
              <textarea value={form.mensaje} onChange={set('mensaje')} rows={5}
                placeholder={t('messagePlaceholder')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: errors.mensaje ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
              {errors.mensaje && <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"><AlertCircle size={12} />{errors.mensaje}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)' }}>
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> {t('submitting')}</>
                : t('submit')}
            </button>

            <p className="text-xs text-center pt-1" style={{ color: 'var(--on-surface-variant)' }}>
              {t('termsPrefix')}{' '}
              <Link href="/normas" className="underline underline-offset-2" style={{ color: 'var(--primary)' }}>{t('termsLink')}</Link>{' '}
              {t('termsMiddle')}{' '}
              <Link href="#" className="underline underline-offset-2" style={{ color: 'var(--primary)' }}>{t('termsCancellation')}</Link>.
            </p>
          </form>
        </div>

        {/* ── SUMMARY ──────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border overflow-hidden shadow-lg" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
            <div className="flex gap-3 p-4 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
              <img src={`/images/${slug}/${slug}-1.jpg`} alt={apartment.title} className="w-20 h-20 object-cover rounded-xl shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold leading-snug" style={{ color: 'var(--on-surface)' }}>{apartment.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{apartment.subtitle}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-xs font-semibold">{apartment.rating.toFixed(2)}</span>
                  <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>· {apartment.reviewCount} reseñas</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {(form.checkIn || form.checkOut) && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--on-surface-variant)' }}>{t('summaryDates')}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--arena)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>{t('checkIn')}</p>
                      <p className="font-semibold text-xs" style={{ color: 'var(--on-surface)' }}>{form.checkIn ? formatDate(form.checkIn, locale) : '—'}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--arena)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>{t('checkOut')}</p>
                      <p className="font-semibold text-xs" style={{ color: 'var(--on-surface)' }}>{form.checkOut ? formatDate(form.checkOut, locale) : '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm py-1">
                <span style={{ color: 'var(--on-surface-variant)' }}>{t('summaryGuests')}</span>
                <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{form.personas} {form.personas === 1 ? t('guest') : t('guestsPlural')}</span>
              </div>

              <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--outline-variant)' }}>
                {nights > 0 ? (
                  <>
                    {breakdown.map((g, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--on-surface-variant)' }}>
                          {g.price}€ × {t('nights', { count: g.count })}
                        </span>
                        <span style={{ color: 'var(--on-surface)' }}>{g.price * g.count}€</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--on-surface-variant)' }}>{t('cleaning')}</span>
                      <span style={{ color: 'var(--on-surface)' }}>{cleaningFee}€</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: 'var(--outline-variant)', color: 'var(--primary)' }}>
                      <span>{t('totalEstimate')}</span>
                      <span>{total}€</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--on-surface-variant)' }}>{t('perNight')}</span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>{apartment.priceRange[0]}€ – {apartment.priceRange[1]}€</span>
                  </div>
                )}
              </div>

              <p className="text-xs pt-1" style={{ color: 'var(--on-surface-variant)' }}>
                {t('priceNote')}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
