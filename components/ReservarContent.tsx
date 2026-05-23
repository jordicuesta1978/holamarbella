'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, Loader2, Calendar } from 'lucide-react';
import type { Apartment } from '@/lib/apartments';
import { crearReserva } from '@/app/actions/reservar';

function calcNights(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
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

export default function ReservarContent({ apartment, slug }: { apartment: Apartment; slug: string }) {
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
  const total = nights > 0 ? nights * midPrice : 0;

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const val = field === 'personas' ? Number(e.target.value) : e.target.value;
      setForm(f => ({ ...f, [field]: val }));
      setErrors(err => ({ ...err, [field]: undefined, global: undefined }));
    };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre.trim()) e.nombre = 'Por favor, introduce tu nombre completo.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Introduce un email válido.';
    if (!form.checkIn) e.checkIn = 'Selecciona la fecha de llegada.';
    if (!form.checkOut) e.checkOut = 'Selecciona la fecha de salida.';
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) {
      e.checkOut = 'La salida debe ser posterior a la llegada.';
    }
    if (!form.mensaje.trim() || form.mensaje.trim().length < 10) e.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

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
    });

    if (!result.ok) {
      setErrors({ global: 'No se pudo enviar la solicitud. Por favor, inténtalo de nuevo.' });
      setSubmitting(false);
      return;
    }

    router.push(`/confirmacion?apartment=${slug}&name=${encodeURIComponent(form.nombre.split(' ')[0])}`);
  };

  const maxPersonas = apartment.capacity.persons;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
      <Link href={`/apartamentos/${slug}`} className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity" style={{ color: 'var(--primary)' }}>
        <ChevronLeft size={16} />
        Volver al apartamento
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

        {/* ── FORM ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>Solicitar reserva</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--on-surface-variant)' }}>
            Rellena el formulario y revisaremos tu solicitud.
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
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre y apellido"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: errors.nombre ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
              {errors.nombre && <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"><AlertCircle size={12} />{errors.nombre}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="tu@email.com"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: errors.email ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
              {errors.email && <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"><AlertCircle size={12} />{errors.email}</p>}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Teléfono <span className="text-xs font-normal" style={{ color: 'var(--on-surface-variant)' }}>(opcional)</span>
              </label>
              <input type="tel" value={form.telefono} onChange={set('telefono')} placeholder="+34 600 000 000"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }} />
            </div>

            {/* Fechas */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                <span className="inline-flex items-center gap-1.5"><Calendar size={14} />Fechas <span className="text-red-500">*</span></span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--on-surface-variant)' }}>Llegada</p>
                  <input type="date" value={form.checkIn} onChange={set('checkIn')} min={todayStr()}
                    className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: errors.checkIn ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
                  {errors.checkIn && <p className="flex items-center gap-1.5 mt-1 text-xs text-red-500"><AlertCircle size={12} />{errors.checkIn}</p>}
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--on-surface-variant)' }}>Salida</p>
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
                Número de personas <span className="text-red-500">*</span>
              </label>
              <select value={form.personas} onChange={set('personas')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 cursor-pointer"
                style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}>
                {Array.from({ length: maxPersonas }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} persona{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea value={form.mensaje} onChange={set('mensaje')} rows={5}
                placeholder="Cuéntanos el motivo de tu viaje o cualquier pregunta que tengas..."
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                style={{ borderColor: errors.mensaje ? '#ef4444' : 'var(--outline-variant)', color: 'var(--on-surface)' }} />
              {errors.mensaje && <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500"><AlertCircle size={12} />{errors.mensaje}</p>}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)' }}>
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Enviando solicitud...</>
                : 'Enviar solicitud'}
            </button>

            <p className="text-xs text-center pt-1" style={{ color: 'var(--on-surface-variant)' }}>
              Al enviar aceptas nuestras{' '}
              <Link href="/normas" className="underline underline-offset-2" style={{ color: 'var(--primary)' }}>normas de la casa</Link>{' '}
              y la{' '}
              <Link href="#" className="underline underline-offset-2" style={{ color: 'var(--primary)' }}>política de cancelación</Link>.
            </p>
          </form>
        </div>

        {/* ── SUMMARY ──────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-2xl border overflow-hidden shadow-lg" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
            <div className="flex gap-3 p-4 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
              <img src={`/images/${slug}/${slug}-1.jpg`} alt={apartment.title} className="w-20 h-20 object-cover rounded-xl shrink-0" />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--on-surface-variant)' }}>{apartment.subtitle}</p>
                <p className="text-sm font-bold leading-snug" style={{ color: 'var(--on-surface)' }}>{apartment.title}</p>
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
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--on-surface-variant)' }}>Fechas</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--arena)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>Llegada</p>
                      <p className="font-semibold text-xs" style={{ color: 'var(--on-surface)' }}>{form.checkIn ? formatDate(form.checkIn) : '—'}</p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--arena)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>Salida</p>
                      <p className="font-semibold text-xs" style={{ color: 'var(--on-surface)' }}>{form.checkOut ? formatDate(form.checkOut) : '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm py-1">
                <span style={{ color: 'var(--on-surface-variant)' }}>Personas</span>
                <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{form.personas} {form.personas === 1 ? 'persona' : 'personas'}</span>
              </div>

              <div className="border-t pt-3 space-y-2" style={{ borderColor: 'var(--outline-variant)' }}>
                {nights > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--on-surface-variant)' }}>{midPrice}€ × {nights} noche{nights > 1 ? 's' : ''}</span>
                      <span style={{ color: 'var(--on-surface)' }}>{total}€</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: 'var(--outline-variant)', color: 'var(--primary)' }}>
                      <span>Total estimado</span>
                      <span>{total}€</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--on-surface-variant)' }}>Precio / noche</span>
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>{apartment.priceRange[0]}€ – {apartment.priceRange[1]}€</span>
                  </div>
                )}
              </div>

              <p className="text-xs pt-1" style={{ color: 'var(--on-surface-variant)' }}>
                El precio exacto será confirmado al revisar tu solicitud.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
