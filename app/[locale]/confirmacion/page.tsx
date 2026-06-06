import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ConfirmacionContent from '@/components/ConfirmacionContent';

export const dynamic = 'force-dynamic';

export default async function ConfirmacionPage() {
  const t = await getTranslations('confirmacion');
  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />
      <Suspense fallback={
        <div className="max-w-2xl mx-auto px-8 py-32 text-center" style={{ color: 'var(--on-surface-variant)' }}>
          {t('loading')}
        </div>
      }>
        <ConfirmacionContent />
      </Suspense>
      <Footer />
    </div>
  );
}
