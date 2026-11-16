import type { Metadata } from 'next';
import { getAllEquipments, getAllBlogPosts, getCategoriesWithCount, getHeroSettings, getCompanySettings } from '@/lib/db';
import { toPublicPost, isPublished } from '@/lib/public-data';
import { Hero } from '@/components/Hero';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { CategoryGrid } from '@/components/CategoryGrid';
import { isTopLevel, parentOf } from '@/lib/category-tree';
import { getSiteMenu, getRentalLineIds } from '@/lib/site-menu';
import { FeaturedEquipments } from '@/components/FeaturedEquipments';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { HowItWorks } from '@/components/HowItWorks';
import { BlogPreview } from '@/components/BlogPreview';
import { FinalCta } from '@/components/FinalCta';
import { ServicesPreview } from '@/components/ServicesPreview';
import { LocationStrip } from '@/components/LocationStrip';
import { SITE_URL, absoluteUrl, categoryPath, equipmentPath, jsonLdHtml, slugify } from '@/lib/site';

// Conteúdo vem do banco editável pelo CRM: renderiza a cada acesso
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const allEquipments = getAllEquipments();
  const active = allEquipments.filter((eq) => eq.status === 'active');
  const featured = active.filter((eq) => eq.isFeatured);
  const allCategories = getCategoriesWithCount(true);
  // Na página inicial aparecem só as categorias principais das linhas de locação
  const rental = getRentalLineIds();
  const categories = allCategories.filter((c) => isTopLevel(c, allCategories) && rental.has(c.group));
  const menu = getSiteMenu();
  const categoryNames = categories.map((c) => c.name);
  const topCategoryOf = Object.fromEntries(allCategories.map((c) => [c.name, parentOf(c, allCategories)?.name || c.name]));
  // Versão pública: sem e-mails de comentaristas nem comentários pendentes
  const settings = getCompanySettings();
  const blogPosts = getAllBlogPosts().filter(isPublished).map(toPublicPost);

  // Dados estruturados da página inicial: catálogo, destaques, serviços e artigos
  const business = { '@id': `${SITE_URL}/#empresa` };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'OfferCatalog',
        '@id': `${SITE_URL}/#catalogo`,
        name: 'Locação de máquinas e ferramentas',
        url: absoluteUrl('/locacao'),
        provider: business,
        itemListElement: categories.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'OfferCatalog', name: c.name, url: absoluteUrl(categoryPath(c.name)), numberOfItems: c.count },
        })),
      },
      ...(featured.length
        ? [
            {
              '@type': 'ItemList',
              name: 'Destaques para locação',
              itemListElement: featured.slice(0, 12).map((eq, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'Product',
                  name: eq.name,
                  sku: eq.code,
                  category: eq.category,
                  image: absoluteUrl(eq.image),
                  description: eq.summary || eq.description,
                  url: absoluteUrl(equipmentPath(eq)),
                },
              })),
            },
          ]
        : []),
      ...menu.services.map((s) => ({
        '@type': 'Service',
        name: s.name,
        description: s.summary,
        serviceType: s.name,
        provider: business,
        areaServed: 'Belo Horizonte e região metropolitana',
        url: absoluteUrl(`/servicos#${slugify(s.name)}`),
      })),
      ...(blogPosts.length
        ? [
            {
              '@type': 'ItemList',
              name: 'Guias para planejar a obra',
              itemListElement: blogPosts.slice(0, 6).map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                item: { '@type': 'BlogPosting', headline: p.title, url: absoluteUrl(`/blog/${p.slug}`), image: absoluteUrl(p.image) },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      {/* Abertura com o quadro do pátio */}
      <Hero hero={getHeroSettings()} boardItems={featured} totalItems={active.length} />

      {/* Busca */}
      <SearchFilterBar groups={categories.map((c) => ({ name: c.name, count: c.count }))} total={active.length} />

      {/* Categorias de Equipamentos */}
      <CategoryGrid categories={categories} lines={menu.lines} />

      {/* Equipamentos em Destaque */}
      <FeaturedEquipments equipments={featured} categoryNames={categoryNames} topCategoryOf={topCategoryOf} />

      {/* Serviços (mesma ordem do menu: Locação, Serviços, Empresa, Localização) */}
      <ServicesPreview services={menu.services} />

      {/* Empresa: por que escolher a EquiparLoc */}
      <WhyChooseUs />

      {/* Como Funciona (Fluxo visual de 4 passos) */}
      <HowItWorks />

      {/* Localização */}
      <LocationStrip address={settings.address} hours={settings.businessHours} />

      {/* Conteúdo e Conhecimento (Blog preview) */}
      <BlogPreview posts={blogPosts} />

      {/* CTA Final */}
      <FinalCta />
    </main>
  );
}
