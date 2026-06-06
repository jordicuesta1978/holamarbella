"use client";
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

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
        <Link href="/">
          <img
            src="/images/hmb-logo.jpeg"
            alt="HolaMarbella"
            className="h-7 w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>
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
        <div
          className="text-sm font-medium px-3 py-1 rounded-full border flex items-center gap-1"
          style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
        >
          <button onClick={() => switchLocale('es')} style={pill('es')} aria-label="Español">ES</button>
          <span style={{ opacity: 0.4 }}>/</span>
          <button onClick={() => switchLocale('en')} style={pill('en')} aria-label="English">EN</button>
        </div>
      </nav>
    </header>
  );
}
