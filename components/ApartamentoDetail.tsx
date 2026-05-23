'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const MapboxMap = dynamic(() => import('./MapboxMap'), { ssr: false });
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getPhotos } from '@/lib/apartments';
import type { Apartment } from '@/lib/apartments';
import {
  X, ChevronLeft, ChevronRight, Grid3X3, Check, Wifi, Wind,
  Waves, Mountain, ChefHat, Tv, Laptop, Sun, Car, Star, BedDouble,
  Droplets, ShieldCheck, Building2, Shirt, Coffee, Users,
  Clock, Ban, Cigarette, Volume2, Camera,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>> = {
  'Baño': Droplets,
  'Dormitorio': BedDouble,
  'Cocina': ChefHat,
  'Lavandería': Shirt,
  'Entretenimiento': Tv,
  'Trabajo y conectividad': Wifi,
  'Climatización': Wind,
  'Seguridad': ShieldCheck,
  'Exterior y vistas': Sun,
  'Acceso': Building2,
  'Servicios': Star,
};

function getTopAmenityIcon(label: string): React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }> {
  const l = label.toLowerCase();
  if (l.includes('wifi') || l.includes('internet')) return Wifi;
  if (l.includes('a/c') || l.includes('aire') || l.includes('ventilador')) return Wind;
  if (l.includes('vista')) return Mountain;
  if (l.includes('cocina')) return ChefHat;
  if (l.includes('piscina') || l.includes('playa') || l.includes('mar') || l.includes('fontanilla')) return Waves;
  if (l.includes('netflix') || l.includes('tv') || l.includes('amazon')) return Tv;
  if (l.includes('trabajo') || l.includes('escritorio')) return Laptop;
  if (l.includes('terraza')) return Sun;
  if (l.includes('parking') || l.includes('aparcamiento')) return Car;
  if (l.includes('desayuno') || l.includes('café')) return Coffee;
  return Check;
}

const APT_COORDS: Record<string, { lng: number; lat: number }> = {
  paloma:  { lng: -4.889767747525261, lat: 36.51172291221833 },
  micu:    { lng: -4.889447320540719, lat: 36.51164955871326 },
  larysol: { lng: -4.896228389853668, lat: 36.50957364983489 },
  ami:     { lng: -4.888339196628418, lat: 36.51164611321041 },
  banesto: { lng: -4.887352242670257, lat: 36.50973673900918 },
};

function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

export default function ApartamentoDetail({ apartment, slug }: { apartment: Apartment; slug: string }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [persons, setPersons] = useState(1);

  const photos = getPhotos(slug, apartment.photoCount);
  const nights = calcNights(checkIn, checkOut);
  const midPrice = Math.round((apartment.priceRange[0] + apartment.priceRange[1]) / 2);
  const total = nights > 0 ? nights * midPrice : 0;

  const openLightbox = (idx: number) => { setLightboxIndex(idx); setLightboxOpen(true); };
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevPhoto = useCallback(() => setLightboxIndex(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const nextPhoto = useCallback(() => setLightboxIndex(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPhoto();
      else if (e.key === 'ArrowRight') nextPhoto();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightboxOpen, prevPhoto, nextPhoto, closeLightbox]);

  useEffect(() => {
    document.body.style.overflow = (lightboxOpen || amenitiesOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxOpen, amenitiesOpen]);

  const descWords = apartment.description.split(' ');
  const shortDesc = descWords.slice(0, 30).join(' ');
  const isLong = descWords.length > 30;

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />

      {/* ── GALLERY ────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="flex md:hidden gap-2 overflow-x-auto snap-x snap-mandatory px-4 py-4 scrollbar-hide">
          {photos.slice(0, 8).map((src, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="snap-start shrink-0 rounded-xl overflow-hidden"
              style={{ width: '80vw', aspectRatio: '4/3' }}
            >
              <img src={src} alt={`${apartment.title} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="hidden md:grid md:grid-cols-[3fr_2fr] gap-2 h-[520px] max-w-7xl mx-auto px-8 py-6">
          <button onClick={() => openLightbox(0)} className="rounded-2xl overflow-hidden block h-full group">
            <img src={photos[0]} alt={apartment.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </button>
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {photos.slice(1, 5).map((src, i) => (
              <button
                key={i}
                onClick={() => openLightbox(i + 1)}
                className={`overflow-hidden block group ${i === 3 ? 'relative' : ''}`}
                style={{ borderRadius: i === 1 ? '0 1rem 0 0' : i === 3 ? '0 0 1rem 0' : undefined }}
              >
                <img src={src} alt={`${apartment.title} ${i + 2}`} className="w-full h-full object-cover group-hover:brightness-90 transition-all duration-300" />
                {i === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                      <Grid3X3 size={14} />
                      Ver todas ({photos.length})
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => openLightbox(0)}
          className="md:hidden mx-auto mb-2 flex items-center gap-2 bg-white border text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow"
          style={{ borderColor: 'var(--outline-variant)', color: 'var(--on-surface)' }}
        >
          <Grid3X3 size={14} />
          Ver todas las fotos ({photos.length})
        </button>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 pb-32 lg:pb-16">

        {/* LEFT COLUMN */}
        <div>
          <div className="py-8 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
            <div className="flex flex-wrap gap-2 items-center mb-3">
<span className="flex items-center gap-1 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                <span className="text-yellow-400">★</span>
                <strong style={{ color: 'var(--on-surface)' }}>{apartment.rating.toFixed(2)}</strong>
                · {apartment.reviewCount} reseñas
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-snug mb-3" style={{ color: 'var(--primary)' }}>
              {apartment.title}
            </h1>
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {apartment.capacity.persons} personas · {apartment.capacity.bedrooms} dormitorio · {apartment.capacity.bed} · {apartment.capacity.bathrooms} baño
              {apartment.capacity.extras ? ` · ${apartment.capacity.extras}` : ''}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--on-surface-variant)' }}>
              Licencia turística: {apartment.license}
            </p>
          </div>

          <div className="py-6 border-b flex items-center gap-4" style={{ borderColor: 'var(--outline-variant)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
              M
            </div>
            <div>
              <p className="font-bold" style={{ color: 'var(--on-surface)' }}>Anfitriona: Mar</p>
              <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>Airbnb Superhost · Recepción personal en el apartamento</p>
            </div>
          </div>

          <div className="py-8 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Descripción</h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
              {expanded || !isLong ? apartment.description : `${shortDesc}...`}
            </p>
            {isLong && (
              <button onClick={() => setExpanded(e => !e)} className="mt-3 text-sm font-bold underline underline-offset-4" style={{ color: 'var(--primary)' }}>
                {expanded ? 'Leer menos' : 'Leer más'}
              </button>
            )}
          </div>

          <div className="py-8 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--on-surface)' }}>Lo que ofrece este espacio</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {apartment.topAmenities.map((item) => {
                const Icon = getTopAmenityIcon(item);
                return (
                  <div key={item} className="flex items-center gap-3">
                    <Icon size={20} strokeWidth={1.5} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{item}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setAmenitiesOpen(true)}
              className="mt-6 text-sm font-bold px-6 py-3 rounded-xl border transition-all hover:text-white"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
            >
              Mostrar todas las amenidades
            </button>
          </div>

          <div className="py-8 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--on-surface)' }}>Ubicación</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>Marbella, Málaga, España</p>
            {APT_COORDS[slug] && process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
              <MapboxMap lng={APT_COORDS[slug].lng} lat={APT_COORDS[slug].lat} token={process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />
            ) : (
              <div className="w-full rounded-2xl flex items-center justify-center" style={{ height: 280, backgroundColor: 'var(--arena)', border: '1px solid var(--outline-variant)' }}>
                <div className="text-center">
                  <Mountain size={32} strokeWidth={1} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--on-surface-variant)' }}>Mapa disponible próximamente</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--outline-variant)' }}>Mapbox · Pin exacto</p>
                </div>
              </div>
            )}
          </div>

          <div className="py-8 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>Reseñas</h2>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★</span>
                <span className="font-bold" style={{ color: 'var(--on-surface)' }}>{apartment.rating.toFixed(2)}</span>
                <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>· {apartment.reviewCount} reseñas</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {apartment.reviews.map((review, i) => (
                <div key={i} className="p-5 rounded-2xl border" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
                      {review.author[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{review.author}</p>
                      <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{review.location} · {review.date}</p>
                    </div>
                    <div className="ml-auto text-yellow-400 text-sm">{'★'.repeat(review.rating)}</div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>"{review.text}"</p>
                </div>
              ))}
            </div>
          </div>

          <div className="py-8 border-b" style={{ borderColor: 'var(--outline-variant)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--on-surface)' }}>Normas de la casa</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { Icon: Clock, text: 'Check-in: desde las 14:00' },
                { Icon: Clock, text: 'Check-out: hasta las 11:00' },
                { Icon: Users, text: 'Máximo 2 personas' },
                { Icon: Ban, text: 'No se admiten mascotas' },
                { Icon: Ban, text: 'No se permiten fiestas ni eventos' },
                { Icon: Cigarette, text: 'Prohibido fumar' },
                { Icon: Volume2, text: 'Silencio: 22:00 – 8:00' },
                { Icon: Camera, text: 'No fotografías comerciales' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon size={16} strokeWidth={1.5} style={{ color: 'var(--on-surface-variant)', flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: 'var(--on-surface)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="py-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--on-surface)' }}>Política de cancelación</h2>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--on-surface)' }}>Estancias cortas (menos de 28 noches)</p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--on-surface-variant)' }}>
                  <li>· Cancelación gratuita hasta 5 días antes de la llegada</li>
                  <li>· 50% de reembolso entre 5 días antes y la llegada</li>
                  <li>· Sin reembolso desde el día de llegada</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--on-surface)' }}>Estancias largas (28 noches o más)</p>
                <ul className="text-sm space-y-1" style={{ color: 'var(--on-surface-variant)' }}>
                  <li>· Cancelación gratuita hasta 30 días antes</li>
                  <li>· Primeras 30 noches no reembolsables si cancelas después</li>
                  <li>· Sin reembolso desde el día de llegada</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Sticky booking panel */}
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border shadow-xl p-6" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
            <div className="mb-5">
              {nights > 0 ? (
                <>
                  <p className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>
                    {midPrice}€ <span className="text-base font-normal text-stone-400">/ noche</span>
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
                    {midPrice}€ × {nights} noche{nights > 1 ? 's' : ''} ={' '}
                    <strong style={{ color: 'var(--primary)' }}>{total}€</strong>
                  </p>
                </>
              ) : (
                <p className="text-2xl font-bold" style={{ color: 'var(--on-surface)' }}>
                  {apartment.priceRange[0]}€ – {apartment.priceRange[1]}€{' '}
                  <span className="text-base font-normal text-stone-400">/ noche</span>
                </p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-semibold">{apartment.rating.toFixed(2)}</span>
                <span className="text-sm text-stone-400">· {apartment.reviewCount} reseñas</span>
              </div>
            </div>

            <div className="grid grid-cols-2 border rounded-xl overflow-hidden mb-3" style={{ borderColor: 'var(--outline-variant)' }}>
              <div className="p-3 border-r" style={{ borderColor: 'var(--outline-variant)' }}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Llegada</label>
                <input type="date" value={checkIn} min={new Date().toISOString().split('T')[0]} onChange={e => setCheckIn(e.target.value)} className="w-full text-sm focus:outline-none bg-transparent" style={{ color: 'var(--on-surface)' }} />
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Salida</label>
                <input type="date" value={checkOut} min={checkIn || new Date().toISOString().split('T')[0]} onChange={e => setCheckOut(e.target.value)} className="w-full text-sm focus:outline-none bg-transparent" style={{ color: 'var(--on-surface)' }} />
              </div>
            </div>

            <div className="border rounded-xl p-3 mb-4" style={{ borderColor: 'var(--outline-variant)' }}>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Personas</label>
              <select value={persons} onChange={e => setPersons(Number(e.target.value))} className="w-full text-sm focus:outline-none bg-transparent cursor-pointer" style={{ color: 'var(--on-surface)' }}>
                <option value={1}>1 persona</option>
                <option value={2}>2 personas</option>
              </select>
            </div>

            <Link
              href={`/reservar/${apartment.slug}${checkIn && checkOut ? `?checkin=${checkIn}&checkout=${checkOut}&persons=${persons}` : ''}`}
              className="block w-full text-center text-white font-bold text-sm py-4 rounded-xl uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Solicitar reserva
            </Link>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--on-surface-variant)' }}>
              Revisaremos tu solicitud lo antes posible.
            </p>
          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-between px-5 py-3" style={{ backgroundColor: 'white', borderColor: 'var(--outline-variant)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
        <div>
          <span className="font-bold text-base" style={{ color: 'var(--on-surface)' }}>
            {apartment.priceRange[0]}€ – {apartment.priceRange[1]}€
          </span>
          <span className="text-sm text-stone-400"> / noche</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-xs font-semibold">{apartment.rating.toFixed(2)}</span>
            <span className="text-xs text-stone-400">({apartment.reviewCount})</span>
          </div>
        </div>
        <Link href={`/reservar/${apartment.slug}`} className="text-white font-bold text-sm px-6 py-3 rounded-full uppercase tracking-widest transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--primary)' }}>
          Solicitar reserva
        </Link>
      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.95)' }} onClick={closeLightbox}>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-4 py-1 rounded-full">
            {lightboxIndex + 1} / {photos.length}
          </div>
          <button onClick={closeLightbox} className="absolute top-4 right-4 text-white p-2 rounded-full transition-colors hover:bg-white/20" aria-label="Cerrar">
            <X size={24} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevPhoto(); }} className="absolute left-4 text-white p-3 rounded-full transition-colors hover:bg-white/20" aria-label="Foto anterior">
            <ChevronLeft size={32} />
          </button>
          <img src={photos[lightboxIndex]} alt={`${apartment.title} ${lightboxIndex + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextPhoto(); }} className="absolute right-4 text-white p-3 rounded-full transition-colors hover:bg-white/20" aria-label="Foto siguiente">
            <ChevronRight size={32} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-[90vw] px-2">
            {photos.map((src, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setLightboxIndex(i); }} className={`shrink-0 rounded-md overflow-hidden transition-all ${i === lightboxIndex ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`} style={{ width: 48, height: 36 }}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── AMENITIES MODAL ───────────────────────────────────────── */}
      {amenitiesOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setAmenitiesOpen(false)}>
          <div className="relative w-full max-w-2xl my-8 mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: 'white' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--on-surface)' }}>Todas las amenidades</h2>
              <button onClick={() => setAmenitiesOpen(false)} className="p-2 rounded-full transition-colors hover:bg-stone-100">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-8">
              {apartment.amenityCategories.map(({ label, items }) => {
                const CatIcon = CATEGORY_ICONS[label] || Star;
                return (
                  <div key={label}>
                    <div className="flex items-center gap-2 mb-3">
                      <CatIcon size={18} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
                      <h3 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--on-surface)' }}>{label}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map(item => (
                        <div key={item} className="flex items-center gap-2">
                          <Check size={14} strokeWidth={2.5} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <span className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="lg:block">
        <Footer />
      </div>
    </div>
  );
}
