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
  return {
    title: `${apt.title} · HolaMarbella`,
    description: apt.description.slice(0, 160),
  };
}

export default async function ApartamentoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();
  return <ApartamentoDetail apartment={apartment} slug={slug} />;
}
