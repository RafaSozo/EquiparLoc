import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllEquipments, getCategoriesWithCount, getProductLines } from '@/lib/db';
import { CatalogClient } from '@/components/CatalogClient';
import { SITE_URL, absoluteUrl, categoryPath, equipmentPath, jsonLdHtml, slugify } from '@/lib/site';
import { namesInBranch, parentOf } from '@/lib/category-tree';

// Dados editáveis pelo CRM: renderiza a cada acesso
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ categoria: string }>;
}

function findCategory(slug: string) {
  return getCategoriesWithCount(true).find((c) => slugify(c.name) === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const category = findCategory(categoria);
  if (!category) return { title: 'Grupo não encontrado | EquiparLoc', robots: { index: false } };

  const title = `Aluguel de ${category.name} | EquiparLoc`;
  const description = `${category.description} ${category.count} ${category.count === 1 ? 'modelo' : 'modelos'} para locação. Peça seu orçamento.`;
  const url = categoryPath(category.name);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'website', url, images: category.image ? [{ url: category.image, alt: category.name }] : undefined },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoria } = await params;
  const categories = getCategoriesWithCount(true);
  const category = categories.find((c) => slugify(c.name) === categoria);
  if (!category) notFound();

  const active = getAllEquipments().filter((eq) => eq.status === 'active');
  // A principal mostra também os itens das subcategorias
  const branch = namesInBranch(category.name, categories);
  const items = active.filter((eq) => branch.has(eq.category));
  const parent = parentOf(category, categories);
  const lines = getProductLines();
  const isService = lines.find((l) => l.id === category.group)?.kind === 'servico';
  const pageUrl = absoluteUrl(categoryPath(category.name));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#grupo`,
        name: `Aluguel de ${category.name}`,
        description: category.description,
        url: pageUrl,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.map((eq, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: eq.name,
            url: absoluteUrl(equipmentPath(eq)),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          isService
            ? { '@type': 'ListItem', position: 2, name: 'Serviços', item: absoluteUrl('/servicos') }
            : { '@type': 'ListItem', position: 2, name: 'Locação', item: absoluteUrl('/locacao') },
          ...(parent
            ? [{ '@type': 'ListItem', position: 3, name: parent.name, item: absoluteUrl(categoryPath(parent.name)) }]
            : []),
          { '@type': 'ListItem', position: parent ? 4 : 3, name: category.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-chapa pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Carregando equipamentos...</div>}>
        <CatalogClient initialEquipments={active} categories={categories} fixedCategory={category} lines={lines} />
      </Suspense>
    </main>
  );
}
