import React from 'react';
import type { Metadata } from 'next';
import { getAllBlogPosts } from '@/lib/db';
import { toPublicPost, isPublished } from '@/lib/public-data';
import { BlogCatalogClient } from '@/components/blog/BlogCatalogClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog Técnico & Conhecimento em Engenharia | EquiparLoc',
  alternates: { canonical: '/blog' },
  description:
    'Artigos técnicos sobre terraplenagem, requisitos NR-12 e NR-18, dimensionamento de escavadeiras e gestão de frotas pesadas.',
  openGraph: {
    title: 'Blog Técnico & Conhecimento em Engenharia | EquiparLoc',
    description:
      'Artigos técnicos sobre terraplenagem, requisitos NR-12 e NR-18, dimensionamento de escavadeiras e gestão de frotas pesadas.',
    type: 'website',
    url: '/blog',
    images: ['/images/hero_heavy_machinery_1793461100728.jpg'],
  },
};

export default function BlogListingPage() {
  // Versão pública: sem e-mails de comentaristas nem comentários pendentes
  const posts = getAllBlogPosts().filter(isPublished).map(toPublicPost);

  return (
    <main className="min-h-screen bg-chapa py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
            Guias para planejar a obra
          </h1>
          <p className="text-base text-aco-medio mt-3 leading-relaxed max-w-2xl">
            Como dimensionar máquinas, cumprir as normas NR-12 e NR-18 e comparar custos de locação,
            escrito pela nossa equipe técnica.
          </p>
        </div>

        {/* Interactive Blog Catalog (Search, Filter, Tags & Cards) */}
        <BlogCatalogClient posts={posts} />
      </div>
    </main>
  );
}
