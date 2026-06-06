"use client";
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('footer');
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
          {t('rights')}
        </p>
        <div className="flex gap-8 text-xs uppercase tracking-widest" style={{ color: 'var(--on-surface-variant)' }}>
          <Link href="#" className="hover:opacity-70 transition-opacity">{t('privacy')}</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">{t('terms')}</Link>
          <Link href="#" className="hover:opacity-70 transition-opacity">{t('contact')}</Link>
        </div>
      </div>
    </footer>
  );
}
