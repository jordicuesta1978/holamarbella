"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'Apartamentos', href: '/apartamentos' },
  { label: 'Registro de viajeros', href: '/registro-viajeros' },
  { label: 'Información', href: '/informacion' },
  { label: 'Normas de la casa', href: '/normas' },
];

export default function Header() {
  const pathname = usePathname();

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
        <button
          className="text-sm font-medium px-3 py-1 rounded-full border"
          style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}
        >
          ES / EN
        </button>
      </nav>
    </header>
  );
}
