"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, MapPin, House } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const HERO_SLIDES = [
  { src: "/images/paloma/paloma-1.jpg",   label: "Piso Paloma" },
  { src: "/images/micu/micu-1.jpg",       label: "Piso Micu" },
  { src: "/images/larysol/larysol-1.jpg", label: "Piso Larysol" },
  { src: "/images/banesto/banesto-1.jpg", label: "Ático Banesto" },
  { src: "/images/ami/ami-1.jpg",         label: "Ático AMI" },
];

const apartments = [
  {
    name: "Piso Paloma",
    location: "Centro · Playa con vistas espectaculares",
    slug: "paloma",
    img: "/images/paloma/paloma-1.jpg",
  },
  {
    name: "Piso Micu",
    location: "Casco Antiguo · Playa a 5 minutos",
    slug: "micu",
    img: "/images/micu/micu-1.jpg",
  },
  {
    name: "Piso Larysol",
    location: "Playa de la Fontanilla · Centro",
    slug: "larysol",
    img: "/images/larysol/larysol-1.jpg",
  },
  {
    name: "Ático Banesto",
    location: "La Alameda · Centro y Playa",
    slug: "banesto",
    img: "/images/banesto/banesto-1.jpg",
  },
  {
    name: "Ático AMI",
    location: "Ubicación inmejorable · Coqueto ático",
    slug: "ami",
    img: "/images/ami/ami-1.jpg",
  },
];

const reviews = [
  {
    text: "Mar fue una anfitriona excepcional. El apartamento estaba impecable y la ubicación no podría ser mejor para descubrir Marbella.",
    author: "Carlos · Madrid",
  },
  {
    text: "Mar was an amazing host. The apartment was spotless and the location couldn't be better. Perfect for a long stay.",
    author: "Sarah · London",
  },
  {
    text: "Todo perfecto desde el primer mensaje. Mar nos recibió en persona y el apartamento superó todas nuestras expectativas.",
    author: "Laura · Barcelona",
  },
];

const FEATURES = [
  {
    Icon: Users,
    title: 'Trato',
    italic: 'Personal',
    desc: 'Atención directa y personalizada. Recepción a la llegada en persona y disponibilidad durante toda la estancia.',
  },
  {
    Icon: MapPin,
    title: 'Excelentes',
    italic: 'Localizaciones',
    desc: 'Apartamentos en las zonas más estratégicas de Marbella para que puedas ir a pie a todas partes.',
  },
  {
    Icon: House,
    title: 'Siéntete',
    italic: 'en Casa',
    desc: 'Espacios cuidados y equipados con mimo para ofrecer el máximo confort y calidez hogareña.',
  },
];

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>

      <Header />

      {/* HERO WRAPPER — search bar is sibling of section to avoid overflow-hidden clipping */}
      <div className="relative">
        <section className="relative flex items-center overflow-hidden" style={{ height: '85svh', minHeight: '520px' }}>
          {/* Carousel images */}
          <div className="absolute inset-0 z-0">
            {HERO_SLIDES.map((slide, idx) => (
              <img
                key={idx}
                src={slide.src}
                alt={slide.label}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === heroIndex ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.5) 100%)' }} />
          </div>

          {/* Hero copy */}
          <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
            <div className="max-w-2xl">
              <p className="text-white/70 text-sm uppercase tracking-widest mb-4 font-medium">Marbella · España</p>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
                Bienvenidos a vuestra<br />
                estancia perfecta,{' '}
                <span className="font-serif-italic text-[#E5D5C0]" style={{ fontWeight: 'normal' }}>
                  gestionada con mimo.
                </span>
              </h1>
              <p className="text-white/80 text-lg mt-4">Apartamentos de corta estancia para vacaciones o teletrabajo</p>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-8 md:bottom-20 left-0 right-0 z-20 flex justify-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                aria-label={`Ver ${HERO_SLIDES[idx].label}`}
                className={`rounded-full transition-all duration-300 ${idx === heroIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </section>

        {/* SEARCH BAR — desktop: pill overlapping next section; mobile: card below hero */}
        {/* Desktop pill */}
        <div className="hidden md:flex absolute bottom-0 left-0 right-0 z-30 translate-y-1/2 justify-center px-8">
          <div className="bg-white shadow-2xl rounded-full p-3 pl-8 flex flex-row gap-4 items-center w-full max-w-5xl">
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Apartamento</label>
              <select className="w-full border-none bg-transparent py-2 text-sm focus:outline-none cursor-pointer" style={{ color: 'var(--on-surface)' }}>
                <option>Cualquier apartamento</option>
                {apartments.map(a => <option key={a.slug}>{a.name}</option>)}
              </select>
            </div>
            <div className="w-px h-8 bg-stone-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Llegada</label>
              <input type="date" className="w-full border-none bg-transparent py-2 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }} />
            </div>
            <div className="w-px h-8 bg-stone-200 shrink-0" />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Salida</label>
              <input type="date" className="w-full border-none bg-transparent py-2 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }} />
            </div>
            <div className="w-px h-8 bg-stone-200 shrink-0" />
            <div className="w-32 shrink-0">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Personas</label>
              <select className="w-full border-none bg-transparent py-2 text-sm focus:outline-none cursor-pointer" style={{ color: 'var(--on-surface)' }}>
                <option value="1">1 persona</option>
                <option value="2">2 personas</option>
              </select>
            </div>
            <button className="text-white font-bold text-xs px-10 h-12 rounded-full uppercase tracking-widest transition-opacity hover:opacity-90 shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
              Buscar
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 py-4" style={{ backgroundColor: 'var(--arena)' }}>
          <div className="bg-white shadow-lg rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Apartamento</label>
              <select className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }}>
                <option>Cualquier apartamento</option>
                {apartments.map(a => <option key={a.slug}>{a.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Llegada</label>
                <input type="date" className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Salida</label>
                <input type="date" className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }} />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Personas</label>
              <select className="w-full border border-stone-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none" style={{ color: 'var(--on-surface)' }}>
                <option value="1">1 persona</option>
                <option value="2">2 personas</option>
              </select>
            </div>
            <button className="text-white font-bold text-sm py-3 rounded-full uppercase tracking-widest w-full transition-opacity hover:opacity-90" style={{ backgroundColor: 'var(--primary)' }}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* APARTMENTS */}
      <section className="pt-10 md:pt-24 pb-20" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>
              Nuestros <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>Apartamentos</span>
            </h2>
            <Link href="/apartamentos" className="text-sm font-medium underline underline-offset-4" style={{ color: 'var(--primary)' }}>Ver todos →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apt) => (
              <Link key={apt.slug} href={`/apartamentos/${apt.slug}`} className="group block rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={apt.img} alt={apt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--on-surface)' }}>{apt.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{apt.location}</p>
                  <span
                    className="mt-4 inline-block text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full border"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    Ver apartamento
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20" style={{ backgroundColor: '#F5F2EA' }}>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {FEATURES.map(({ Icon, title, italic, desc }, i) => (
            <div key={i} className="px-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(75,118,107,0.12)' }}>
                  <Icon size={28} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--on-surface)' }}>
                {title} <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>{italic}</span>
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST / MAR */}
      <section className="py-24" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6" style={{ color: 'var(--primary)' }}>
              Hola, <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>soy Mar</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>
              Me encanta cuidar cada detalle para que tu estancia en Marbella sea especial. Mi objetivo es que no solo alquiles un apartamento, sino que descubras el alma de la ciudad con la tranquilidad de sentirte en casa.
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div>
                <div className="text-6xl font-bold" style={{ color: 'var(--primary)' }}>4.98</div>
                <div className="text-yellow-400 text-2xl mt-1">★★★★★</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Airbnb Superhost</div>
                <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>+250 reseñas verificadas</div>
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl p-8 border" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
              <p className="font-serif-italic text-base leading-relaxed mb-4" style={{ color: 'var(--on-surface)' }}>
                "{reviews[reviewIndex].text}"
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-px inline-block" style={{ backgroundColor: 'var(--primary)' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                    {reviews[reviewIndex].author}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewIndex((reviewIndex - 1 + reviews.length) % reviews.length)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-all hover:text-white"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                    aria-label="Reseña anterior"
                  >←</button>
                  <button
                    onClick={() => setReviewIndex((reviewIndex + 1) % reviews.length)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-sm transition-all hover:text-white"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)'; }}
                    aria-label="Siguiente reseña"
                  >→</button>
                </div>
              </div>
              <div className="flex gap-1.5 mt-4">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewIndex(i)}
                    className={`rounded-full transition-all duration-300 ${i === reviewIndex ? 'w-4 h-1.5' : 'w-1.5 h-1.5'}`}
                    style={{ backgroundColor: i === reviewIndex ? 'var(--primary)' : 'var(--outline-variant)' }}
                    aria-label={`Reseña ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mar placeholder — sutil, fondo arena */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />
            <div
              className="relative w-full rounded-2xl border-2 overflow-hidden flex flex-col items-center justify-center"
              style={{ aspectRatio: '4/5', backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}
            >
              <div className="flex flex-col items-center justify-center px-10 text-center">
                <div
                  className="w-28 h-28 rounded-full border-2 flex items-center justify-center mb-6 bg-white"
                  style={{ borderColor: 'var(--outline-variant)' }}
                >
                  <span className="text-5xl font-bold select-none" style={{ color: 'var(--primary)' }}>M</span>
                </div>
                <p className="text-2xl font-bold tracking-wide mb-1" style={{ color: 'var(--primary)' }}>Mar</p>
                <p className="text-sm mb-4" style={{ color: 'var(--on-surface-variant)' }}>Anfitriona · Marbella</p>
                <div className="text-yellow-400 text-xl tracking-widest mb-5">★★★★★</div>
                <p className="font-serif-italic text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  "Mi objetivo es que te sientas en casa desde el primer momento."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
