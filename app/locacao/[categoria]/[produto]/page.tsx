import React from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getEquipmentBySlug, getAllEquipments, getAllCategories } from '@/lib/db';
import { parentOf } from '@/lib/category-tree';
import { EquipmentDetailClient } from '@/components/EquipmentDetailClient';
import { SITE_URL, absoluteUrl, jsonLdHtml, slugify, categoryPath, equipmentPath } from '@/lib/site';

// Dados editáveis pelo CRM: renderiza a cada acesso
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ categoria: string; produto: string }>;
}

/** Valor de ficha que vale citar (não "Sob consulta" / "Não se aplica") */
function realValue(v?: string) {
  return !!v && !/consulta|não se aplica|usa motor|sistema hidráulico|conforme o motor/i.test(v);
}

function getPublicEquipment(slug: string) {
  const equipment = getEquipmentBySlug(slug);
  // Rascunhos não devem ficar acessíveis nem indexáveis
  if (!equipment || equipment.status !== 'active') return undefined;
  return equipment;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { produto } = await params;
  const equipment = getPublicEquipment(produto);

  if (!equipment) {
    return {
      title: 'Equipamento Não Encontrado | EquiparLoc',
      robots: { index: false },
    };
  }

  const title = `Locação de ${equipment.name} | EquiparLoc`;
  const extras = [
    realValue(equipment.specs.power) ? `Potência: ${equipment.specs.power}.` : '',
    realValue(equipment.specs.operatingWeight) ? `Peso: ${equipment.specs.operatingWeight}.` : '',
  ].filter(Boolean).join(' ');
  const description = `${equipment.summary}${extras ? ` ${extras}` : ''} Peça seu orçamento de locação.`;
  const url = equipmentPath(equipment);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: [{ url: equipment.image, alt: equipment.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [equipment.image],
    },
  };
}

export default async function EquipmentDetailPage({ params }: Props) {
  const { categoria, produto } = await params;
  const equipment = getPublicEquipment(produto);

  if (!equipment) {
    notFound();
  }
  // Grupo errado no endereço (ex.: produto mudou de grupo): leva ao endereço certo
  if (slugify(equipment.category) !== categoria) {
    permanentRedirect(equipmentPath(equipment));
  }

  const allCategories = getAllCategories();
  const ownCategory = allCategories.find((c) => c.name === equipment.category);
  const parentCategory = ownCategory ? parentOf(ownCategory, allCategories) : undefined;

  const all = getAllEquipments();
  const related = all
    .filter((eq) => eq.id !== equipment.id && eq.category === equipment.category && eq.status === 'active')
    .slice(0, 3);

  // Marca do fabricante (Makita, Bosch...) quando aparece no nome
  const BRANDS = ['Wacker Neuson', 'New Holland', 'Via Trade', 'Makita', 'Bosch', 'DeWalt', 'Weber', 'Menegotti', 'Dynapac', 'Toyama', 'CSM', 'Mecan', 'JCB', 'Metabo', 'Nakashi'];
  const brand = BRANDS.find((b) => equipment.name.toLowerCase().includes(b.toLowerCase()));

  const pageUrl = absoluteUrl(equipmentPath(equipment));
  const images = Array.from(new Set([equipment.image, ...(equipment.gallery || [])])).map((img) => absoluteUrl(img));

  // Dados estruturados (Schema.org) para mecanismos de busca.
  // Sem "price": locação é sob consulta e preço 0 seria informação falsa para o Google.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${pageUrl}#equipamento`,
        name: equipment.name,
        url: pageUrl,
        image: images,
        description: equipment.description,
        sku: equipment.code,
        category: equipment.category,
        ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Peso operacional', value: equipment.specs.operatingWeight },
          { '@type': 'PropertyValue', name: 'Potência', value: equipment.specs.power },
          { '@type': 'PropertyValue', name: 'Combustível', value: equipment.specs.fuelType },
        ].filter((p) => realValue(p.value)),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Locação', item: absoluteUrl('/locacao') },
          ...[...(parentCategory ? [parentCategory.name] : []), equipment.category].map((name, i) => ({
            '@type': 'ListItem',
            position: 3 + i,
            name,
            item: absoluteUrl(categoryPath(name)),
          })),
          { '@type': 'ListItem', position: parentCategory ? 5 : 4, name: equipment.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-chapa pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <EquipmentDetailClient
        equipment={equipment}
        relatedEquipments={related}
        parentCategoryName={parentCategory?.name}
      />
    </main>
  );
}
