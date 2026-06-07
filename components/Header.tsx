"use client";
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV_LINKS = [
    { label: t('apartamentos'), href: '/apartamentos' },
    { label: t('registro'), href: '/registro-viajeros' },
    { label: t('informacion'), href: '/informacion' },
    { label: t('normas'), href: '/normas' },
  ];

  function switchLocale(target: 'es' | 'en') {
    if (target === locale) return;
    const qs = searchParams.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    router.replace(url, { locale: target });
  }

  const pill = (loc: 'es' | 'en') => ({
    fontWeight: locale === loc ? 700 : 400,
    opacity: locale === loc ? 1 : 0.55,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    padding: 0,
    fontSize: 'inherit',
  } as React.CSSProperties);

  return (
    <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
      <nav className="max-w-7xl mx-auto px-8 py-3 flex justify-between items-center">
        <Link href="/" onClick={() => setMenuOpen(false)}>
          <img
            src="/images/hmb-logo.jpeg"
            alt="HolaMarbella"
            className="h-7 w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-8 text-sm">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors hover:opacity-70"
              style={{
                color: 'var(--primary)',
                fontWeight: pathname.startsWith(href) ? '600' : '400',
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side: locale pill + hamburger */}
        <div className="flex items-center gap-3">
          <div
            className="text-sm font-medium px-3 py-1 rounded-full border flex items-center gap-1"
            style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
          >
            <button onClick={() => switchLocale('es')} style={pill('es')} aria-label="Español">ES</button>
            <span style={{ opacity: 0.4 }}>/</span>
            <button onClick={() => switchLocale('en')} style={pill('en')} aria-label="English">EN</button>
          </div>

          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ color: 'var(--primary)' }}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}
        >
          <nav className="flex flex-col px-8 py-4 gap-1">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="py-3 text-base border-b last:border-b-0 transition-opacity hover:opacity-70"
                style={{
                  color: 'var(--primary)',
                  fontWeight: pathname.startsWith(href) ? '700' : '500',
                  borderColor: 'var(--outline-variant)',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
