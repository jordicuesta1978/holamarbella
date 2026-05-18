import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t py-12" style={{ backgroundColor: 'var(--arena)', borderColor: 'var(--outline-variant)' }}>
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Link href="/">
          <img
            src="/images/hmb-logo.jpeg"
            alt="HolaMarbella"
            className="h-7 w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          © 2026 HolaMarbella · Todos los derechos reservados
        </p>
        <div className="flex gap-8 text-xs uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          <Link href="#" className="hover:opacity-70 transition-opacity">Privacidad</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">Términos</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">Contacto</Link>
        </div>
      </div>
    </footer>
  );
}
