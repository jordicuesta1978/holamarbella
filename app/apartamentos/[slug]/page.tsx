import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getApartmentBySlug, getApartments } from '@/lib/db';
import ApartamentoDetail from '@/components/ApartamentoDetail';

export async function generateStaticParams() {
  const apartments = await getApartments();
  return apartments.map(a => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const apt = await getApartmentBySlug(slug);
  if (!apt) return {};
  const displayName = apt.title;
  return {
    title: `${displayName} · HolaMarbella`,
    description: apt.description.slice(0, 160),
  };
}

export default async function ApartamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkin?: string; checkout?: string }>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();
  return (
    <ApartamentoDetail
      apartment={apartment}
      slug={slug}
      initialCheckIn={sp.checkin ?? ''}
      initialCheckOut={sp.checkout ?? ''}
    />
  );
}
