import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { getAllCategories, getAllEquipments } from '@/lib/db';
import { childrenOf, namesInBranch } from '@/lib/category-tree';
import { getServiceCategories, serviceAnchor } from '@/lib/site-menu';
import { SITE_URL, absoluteUrl, jsonLdHtml, categoryPath } from '@/lib/site';
import { EquipmentCard } from '@/components/EquipmentCard';

// Serviços cadastrados no painel (linhas do tipo "Serviço"): monta a cada acesso
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const names = getServiceCategories().flatMap((g) => g.categories.map((c) => c.name));
  const list = names.length ? names.join(', ') : 'Serviços para obra';
  return {
    title: `Serviços: ${list} | EquiparLoc`,
    alternates: { canonical: '/servicos' },
    description: `${list} com equipe e máquinas próprias da EquiparLoc em Belo Horizonte. Peça seu orçamento.`.slice(0, 160),
  };
}

/** Texto do painel em parágrafos (separados por linha em branco). */
const paragraphs = (text?: string) =>
  (text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

export default function ServicosPage() {
  const groups = getServiceCategories();
  const services = groups.flatMap((g) => g.categories);
  const allCategories = getAllCategories();
  const active = getAllEquipments().filter((eq) => eq.status === 'active');
  const intro = groups.length === 1 && groups[0].line.description
    ? groups[0].line.description
    : 'Além da locação, fazemos o serviço com equipe e máquinas próprias.';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': services.map((s) => ({
      '@type': 'Service',
      '@id': `${absoluteUrl('/servicos')}#${serviceAnchor(s.name)}`,
      name: s.name,
      description: s.description || paragraphs(s.content)[0] || s.name,
      provider: { '@id': `${SITE_URL}/#empresa` },
      url: `${absoluteUrl('/servicos')}#${serviceAnchor(s.name)}`,
    })),
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <section className="bg-concreto border-b border-concreto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95] text-balance max-w-3xl">
            Serviços para a sua obra
          </h1>
          <p className="mt-4 text-base sm:text-lg text-aco-medio max-w-2xl leading-relaxed">{intro}</p>
          {services.length > 1 && (
            <nav aria-label="Serviços" className="mt-6 flex flex-wrap gap-2">
              {services.map((s) => (
                <a
                  key={s.id}
                  href={`#${serviceAnchor(s.name)}`}
                  className="px-4 py-2 text-sm font-semibold text-aco bg-white border border-concreto rounded-[4px] hover:border-aco"
                >
                  {s.name}
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      {services.length === 0 && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-4">
            <p className="text-base text-aco-medio">Estamos atualizando a lista de serviços. Fale com a gente para um orçamento.</p>
            <Link href="/contato" className="btn-acao inline-flex px-6 py-3 text-sm">
              Fale conosco
            </Link>
          </div>
        </section>
      )}

      {services.map((s, i) => {
        const text = paragraphs(s.content);
        const subcategories = childrenOf(s, allCategories);
        const branch = namesInBranch(s.name, allCategories);
        const items = active.filter((eq) => branch.has(eq.category));
        const hasImage = !!s.image;
        return (
          <section
            key={s.id}
            id={serviceAnchor(s.name)}
            className={`scroll-mt-24 py-16 sm:py-24 ${i % 2 ? 'bg-chapa' : 'bg-white'}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`grid grid-cols-1 ${hasImage ? 'lg:grid-cols-12' : ''} gap-10 lg:gap-14 items-center`}>
                <div className={hasImage ? `lg:col-span-6 ${i % 2 ? 'lg:order-2' : ''}` : 'max-w-3xl'}>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">{s.name}</h2>
                  {s.description && !text.length && (
                    <p className="mt-4 text-base text-aco-medio leading-relaxed">{s.description}</p>
                  )}
                  {text.map((p) => (
                    <p key={p} className="mt-4 text-base text-aco-medio leading-relaxed">
                      {p}
                    </p>
                  ))}
                  {!!s.highlights?.length && (
                    <ul className="mt-6 space-y-2.5">
                      {s.highlights.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-aco">
                          <Check className="w-4 h-4 mt-0.5 text-liberado shrink-0" aria-hidden="true" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/orcamento?equipamento=${encodeURIComponent(`Serviço: ${s.name}`)}`}
                      className="btn-acao px-6 py-3 text-sm"
                    >
                      Pedir orçamento de {s.name.toLowerCase()}
                    </Link>
                    {subcategories.length > 0 && items.length > 0 && (
                      <Link
                        href={categoryPath(s.name)}
                        className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-aco border-2 border-aco rounded-[4px] hover:bg-aco hover:text-white transition-colors"
                      >
                        Ver todas as opções
                      </Link>
                    )}
                  </div>
                </div>
                {hasImage && (
                  <div className={`lg:col-span-6 ${i % 2 ? 'lg:order-1' : ''}`}>
                    <div className="relative aspect-[4/3] rounded-[6px] overflow-hidden bg-concreto">
                      <Image src={s.image} alt={s.name} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                    </div>
                  </div>
                )}
              </div>

              {/* Itens publicados nesta categoria de serviço (e nas subcategorias) */}
              {items.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold text-aco mb-5">Opções de {s.name.toLowerCase()}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.slice(0, 6).map((eq) => (
                      <EquipmentCard key={eq.id} equipment={eq} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
