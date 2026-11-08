import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getAllEquipments, getCategoriesWithCount } from '@/lib/db';
import { CatalogClient } from '@/components/CatalogClient';
import { categoryPath } from '@/lib/site';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Locação de Máquinas e Ferramentas para Obra | EquiparLoc',
  alternates: { canonical: '/locacao' },
  description:
    'Aluguel de equipamentos compactos, compactadores, betoneiras, cortadoras de piso, bombas, vibradores, geradores, martelos e máquinas elétricas, com ficha técnica completa.',
  openGraph: {
    title: 'Locação de Máquinas e Ferramentas | EquiparLoc',
    description: 'Frota revisada para obras: compactos, compactação de solos, betoneiras, geradores, martelos e máquinas elétricas.',
    type: 'website',
    url: '/locacao',
    images: ['/images/hero/hero-obra-escavadeira-betoneira.jpg'],
  },
};

interface Props {
  searchParams: Promise<{ cat?: string; q?: string; tipo?: string }>;
}

export default async function LocacaoPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  // Links antigos com ?cat=Grupo levam à página própria do grupo
  if (cat && cat !== 'Todas') permanentRedirect(categoryPath(cat));

  const activeEquipments = getAllEquipments().filter((eq) => eq.status === 'active');

  return (
    <main className="min-h-screen bg-chapa pb-20">
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Carregando equipamentos...</div>}>
        <CatalogClient initialEquipments={activeEquipments} categories={getCategoriesWithCount(true)} />
      </Suspense>
    </main>
  );
}
