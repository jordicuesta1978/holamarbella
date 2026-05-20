import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getApartmentBySlug, getApartments } from '@/lib/db';
import ReservarContent from '@/components/ReservarContent';

export async function generateStaticParams() {
  const apartments = await getApartments();
  return apartments.map(a => ({ slug: a.slug }));
}

export default async function ReservarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();

  return (
    <div style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
      <Header />
      <main>
        <Suspense fallback={
          <div className="max-w-6xl mx-auto px-8 py-32 flex justify-center">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        }>
          <ReservarContent apartment={apartment} slug={slug} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
