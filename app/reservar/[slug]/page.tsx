"use client";

import { use, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApartment } from '@/lib/apartments';

function calcNights(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

type FormState = {
  nombre: string;
  email: string;
  telefono: string;
  personas: number;
  mensaje: string;
};

function ReservarContent({ slug }: { slug: string }) {
  const apartment = getApartment(slug);
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkIn = searchParams.get('checkin') || '';
  const checkOut = searchParams.get('checkout') || '';
  const personsParam = Math.min(2, Math.max(1, Number(searchParams.get('persons')) || 1));

  const [form, setForm] = useState<FormState>({
    nombre: '',
    email: '',
    telefono: '',
    personas: personsParam,
    mensaje: '',
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);

  const nights = calcNights(checkIn, checkOut);
  const midPrice = apartment ? Math.round((apartment.priceRange[0] + apartment.priceRange[1]) / 2) : 0;
  const total = nights > 0 ? nights * midPrice : 0;

  if (!apartment) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-32 text-center">
        <p style={{ color: 'var(--on-surface-variant)' }}>Apartamento no encontrado.</p>
        <Link href="/apartamentos" className="mt-6 inline-block font-bold underline underline-offset-4" style={{ color: 'var(--primary)' }}>
          Ver todos los apartamentos →
        </Link>
      </div>
    );
  }

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = field === 'personas' ? Number(e.target.value) : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    setErrors(err => ({ ...err, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.nombre.trim()) e.nombre = 'Por favor, introduce tu nombre completo.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Introduce un email válido.';
    if (!form.mensaje.trim() || form.mensaje.trim().length < 10) e.mensaje = 'El mensaje debe tener al menos 10 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    // Placeholder: en producción se enviará a Supabase/API
    await new Promise(res => setTimeout(res, 900));
    router.push(
      `/confirmacion?apartment=${slug}&name=${encodeURIComponent(form.nombre.split(' ')[0])}`
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-10">
      {/* Back link */}
      <Link
        href={`/apartamentos/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--primary)' }}
      >
        <ChevronLeft size={16} />
        Volver al apartamento
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">

        {/* ── FORM (left) ───────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>
            Solicitar reserva
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--on-surface-variant)' }}>
            Rellena el formulario y Mar revisará tu solicitud. No se te cobrará nada todavía.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Tu nombre y apellido"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: errors.nombre ? '#ef4444' : 'var(--outline-variant)',
                  color: 'var(--on-surface)',
                }}
              />
              {errors.nombre && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.nombre}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="tu@email.com"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: errors.email ? '#ef4444' : 'var(--outline-variant)',
                  color: 'var(--on-surface)',
                }}
              />
              {errors.email && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Teléfono (opcional) */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Teléfono <span className="text-xs font-normal" style={{ color: 'var(--on-surface-variant)' }}>(opcional)</span>
              </label>
              <input
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="+34 600 000 000"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}
              />
            </div>

            {/* Personas */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Número de personas <span className="text-red-500">*</span>
              </label>
              <select
                value={form.personas}
                onChange={set('personas')}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 cursor-pointer"
                style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}
              >
                <option value={1}>1 persona</option>
                <option value={2}>2 personas</option>
              </select>
            </div>

            {/* Mensaje */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--on-surface)' }}>
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.mensaje}
                onChange={set('mensaje')}
                rows={5}
                placeholder="Cuéntanos el motivo de tu viaje, fechas aproximadas si aún no las tienes, o cualquier pregunta que tengas..."
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
                style={{
                  borderColor: errors.mensaje ? '#ef4444' : 'var(--outline-variant)',
                  color: 'var(--on-surface)',
                }}
              />
              {errors.mensaje && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                  <AlertCircle size={12} /> {errors.mensaje}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Enviando solicitud...</>
              ) : (
                'Enviar solicitud'
              )}
            </button>

            <p className="text-xs text-center pt-1" style={{ color: 'var(--on-surface-variant)' }}>
              Al enviar aceptas nuestras{' '}
              <Link href="/normas" className="underline underline-offset-2" style={{ color: 'var(--primary)' }}>
                normas de la casa
              </Link>{' '}
              y la{' '}
              <Link href="#" className="underline underline-offset-2" style={{ color: 'var(--primary)' }}>
                política de cancelación
              </Link>.
            </p>
          </form>
        </div>

        {/* ── SUMMARY (right, sticky) ───────────────────────────── */}
        <div className="lg:sticky lg:top-24">
          <div
            className="rounded-2xl border overflow-hidden shadow-lg"
            style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}
          >
            {/* Photo + name */}
            <div className="flex gap-3 p-4 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
              <img
                src={`/images/${slug}/${slug}-1.jpg`}
                alt={apartment.title}
                className="w-20 h-20 object-cover rounded-xl shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'var(--on-surface-variant)' }}>
                  {apartment.subtitle}
                </p>
                <p className="text-sm font-bold leading-snug" style={{ color: 'var(--on-surface)' }}>
                  {apartment.title}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-400 text-xs">★</span>
                  <span className="text-xs font-semibold">{apartment.rating.toFixed(2)}</span>
                  <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>· {apartment.reviewCount} reseñas</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Dates */}
              {(checkIn || checkOut) && (
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: 'var(--on-surface-variant)' }}>
                    Fechas
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--arena)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>Llegada</p>
                      <p className="font-semibold text-xs" style={{ color: 'var(--on-surface)' }}>
                        {checkIn ? formatDate(checkIn) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--arena)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--on-surface-variant)' }}>Salida</p>
                      <p className="font-semibold text-xs" style={{ color: 'var(--on-surface)' }}>
                        {checkOut ? formatDate(checkOut) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Persons */}
              <div className="flex justify-between items-center text-sm py-1">
                <span style={{ color: 'var(--on-surface-variant)' }}>Personas</span>
                <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>
                  {form.personas} {form.personas === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              {/* Price breakdown */}
              <div
                className="border-t pt-3 space-y-2"
                style={{ borderColor: 'var(--outline-variant)' }}
              >
                {nights > 0 ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--on-surface-variant)' }}>
                        {midPrice}€ × {nights} noche{nights > 1 ? 's' : ''}
                      </span>
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
                    <span className="font-bold" style={{ color: 'var(--primary)' }}>
                      {apartment.priceRange[0]}€ – {apartment.priceRange[1]}€
                    </span>
                  </div>
                )}
              </div>

              <p className="text-xs pt-1" style={{ color: 'var(--on-surface-variant)' }}>
                El precio exacto será confirmado por Mar al aprobar tu solicitud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />
      <main>
        <Suspense fallback={
          <div className="max-w-6xl mx-auto px-8 py-32 flex justify-center">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        }>
          <ReservarContent slug={slug} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
