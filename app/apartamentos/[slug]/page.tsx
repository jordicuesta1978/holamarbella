import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getApartmentBySlug, getApartments, getBlockedRanges } from '@/lib/db';
import ApartamentoDetail from '@/components/ApartamentoDetail';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apt = await getApartmentBySlug(slug);
  if (!apt) return {};
  return {
    title: `${apt.title} · HolaMarbella`,
    description: apt.description.slice(0, 160),
  };
}

export default async function ApartamentoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const [apartment, blockedRanges] = await Promise.all([
    getApartmentBySlug(slug),
    getBlockedRanges(slug).catch(() => []),
  ]);
  if (!apartment) notFound();

  // Fetch cleaning fee for this apartment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  const { data: aptRow } = await db.from('apartments').select('cleaning_fee').eq('slug', slug).single();
  const cleaningFee: number = aptRow?.cleaning_fee ?? 40;

  return (
    <ApartamentoDetail
      apartment={apartment}
      slug={slug}
      blockedRanges={blockedRanges}
      cleaningFee={cleaningFee}
    />
  );
}
