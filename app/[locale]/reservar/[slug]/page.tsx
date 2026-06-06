import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApartmentBySlug, getPriceRanges } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ReservarContent from '@/components/ReservarContent';

export const dynamic = 'force-dynamic';

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [apartment, priceRanges] = await Promise.all([
    getApartmentBySlug(slug),
    getPriceRanges(slug).catch(() => []),
  ]);
  if (!apartment) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: aptRow } = await (supabaseAdmin as any)
    .from('apartments').select('cleaning_fee').eq('slug', slug).single();
  const cleaningFee: number = aptRow?.cleaning_fee ?? 40;

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />
      <main>
        <Suspense fallback={
          <div className="max-w-6xl mx-auto px-8 py-32 flex justify-center">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        }>
          <ReservarContent
            apartment={apartment}
            slug={slug}
            priceRanges={priceRanges}
            cleaningFee={cleaningFee}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
