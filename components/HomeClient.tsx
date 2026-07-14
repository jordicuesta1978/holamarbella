"use client";
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Users, MapPin, House } from 'lucide-react';
import { FaInstagram, FaFacebookF, FaTiktok, FaAirbnb } from 'react-icons/fa6';
import { FcGoogle } from 'react-icons/fc';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSearch from '@/components/HeroSearch';
import type { Apartment } from '@/lib/apartments';

const AIRBNB_URL = 'https://www.airbnb.es/users/show/5284060';

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

export default function HomeClient({ apartments, globalBlockedDates }: { apartments: Apartment[]; globalBlockedDates: string[] }) {
  const t = useTranslations('home');
  const [heroIndex, setHeroIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  const FEATURES = [
    { Icon: Users, title: t('feature1Title'), italic: t('feature1Italic'), desc: t('feature1Desc') },
    { Icon: MapPin, title: t('feature2Title'), italic: t('feature2Italic'), desc: t('feature2Desc') },
    { Icon: House, title: t('feature3Title'), italic: t('feature3Italic'), desc: t('feature3Desc') },
  ];

  const heroSlides = apartments.map(a => ({
    src: `/images/${a.slug}/${a.slug}-1.jpg`,
    label: a.title,
  }));

  useEffect(() => {
    if (heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>

      <Header />

      {/* HERO WRAPPER */}
      <div className="relative">
        <section className="relative flex items-center overflow-hidden" style={{ height: '85svh', minHeight: '520px' }}>
          {/* Carousel images */}
          <div className="absolute inset-0 z-0">
            {heroSlides.map((slide, idx) => (
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
              <p className="text-white/70 text-sm uppercase tracking-widest mb-4 font-medium">{t('heroEyebrow')}</p>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
                {t('heroTitle1')}<br />
                {t('heroTitle2')}{' '}
                <span className="font-serif-italic text-[#E5D5C0]" style={{ fontWeight: 'normal' }}>
                  {t('heroTitleItalic')}
                </span>
              </h1>
              <p className="text-white/80 text-lg mt-4">{t('heroSubtitle')}</p>
            </div>
          </div>

          {/* Carousel dots */}
          <div className="absolute bottom-8 md:bottom-20 left-0 right-0 z-20 flex justify-center gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setHeroIndex(idx)}
                aria-label={heroSlides[idx].label}
                className={`rounded-full transition-all duration-300 ${idx === heroIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </section>

        {/* HERO SEARCH — pill compacto, integrado en hero */}
        <div className="absolute bottom-8 left-0 right-0 z-30 px-4 md:px-8 flex justify-center">
          <HeroSearch globalBlockedDates={globalBlockedDates} />
        </div>
      </div>

      {/* APARTMENTS */}
      <section className="pt-10 pb-20" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-bold" style={{ color: 'var(--primary)' }}>
              {t('apartmentsTitle')} <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>{t('apartmentsTitleItalic')}</span>
            </h2>
            <Link href="/apartamentos" className="text-sm font-medium underline underline-offset-4" style={{ color: 'var(--primary)' }}>{t('seeAll')}</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apt) => (
              <Link key={apt.slug} href={`/apartamentos/${apt.slug}`} className="group block rounded-2xl overflow-hidden border hover:shadow-xl transition-all duration-300" style={{ borderColor: 'var(--outline-variant)', backgroundColor: 'white' }}>
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={apt.primaryPhotoUrl ?? `/images/${apt.slug}/${apt.slug}-1.jpg`} alt={apt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold mb-1" style={{ color: 'var(--primary)' }}>{apt.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{apt.subtitle}</p>
                  <span
                    className="mt-4 inline-block text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full border"
                    style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  >
                    {t('seeApartment')}
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
              {t('marTitle')} <span className="font-serif-italic" style={{ fontWeight: 'normal' }}>{t('marTitleItalic')}</span>
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--on-surface-variant)' }}>
              {t('marBio')}
            </p>
            <div className="flex items-center gap-6 mb-8">
              <div>
                <div className="text-6xl font-bold" style={{ color: 'var(--primary)' }}>4.98</div>
                <div className="text-yellow-400 text-2xl mt-1">★★★★★</div>
              </div>
              <div>
                <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{t('superhost')}</div>
                <div className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('reviewsCount')}</div>
              </div>
            </div>

            <a
              href={AIRBNB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-8 text-base font-bold transition-opacity hover:opacity-80"
              style={{ color: '#FF5A5F' }}
            >
              <FaAirbnb size={26} />
              {t('airbnbProfile')}
            </a>

            {/* Reviews */}
            <div className="rounded-2xl p-8 border" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
              <p className="font-serif-italic text-base leading-relaxed mb-4" style={{ color: 'var(--on-surface)' }}>
                &ldquo;{reviews[reviewIndex].text}&rdquo;
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

            {/* Follow */}
            <div className="mt-8">
              <p className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--on-surface-variant)' }}>
                {t('followMe')}
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/hola_marbella_apartments/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
                  style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
                >
                  <FaInstagram size={28} color="white" />
                </a>
                <a
                  href="https://www.facebook.com/holaMarBella.casa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
                  style={{ backgroundColor: '#1877F2' }}
                >
                  <FaFacebookF size={26} color="white" />
                </a>
                <a
                  href="https://www.tiktok.com/@hola_marbella"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 border-2"
                  style={{ borderColor: 'var(--outline-variant)' }}
                >
                  <FaTiktok size={28} color="#000000" />
                </a>
                <a
                  href="https://share.google/eI4hLRRMCOefRYXkw"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Google Reviews"
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 border-2"
                  style={{ borderColor: 'var(--outline-variant)' }}
                >
                  <FcGoogle size={28} />
                </a>
              </div>
            </div>
          </div>

          {/* Mar */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }} />
            <div
              className="relative w-full rounded-2xl border-2 overflow-hidden"
              style={{ aspectRatio: '4/5', backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}
            >
              <img
                src="https://kftyemxltrzxafzpyafh.supabase.co/storage/v1/object/public/Public/mar-diez.jpg"
                alt={`Mar · ${t('marRole')}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
