import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { SERVICOS } from '@/lib/servicos';
import { SITE_URL, absoluteUrl, jsonLdHtml, categoryPath } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Serviço de Terraplenagem | EquiparLoc',
  alternates: { canonical: '/servicos' },
  description:
    'Terraplenagem com miniescavadeira, minicarregadeira e retroescavadeira, com equipe e operador próprios. Peça seu orçamento.',
};

export default function ServicosPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': SERVICOS.map((s) => ({
      '@type': 'Service',
      '@id': `${absoluteUrl('/servicos')}#${s.id}`,
      name: s.nome,
      description: s.resumo,
      provider: { '@id': `${SITE_URL}/#empresa` },
      url: `${absoluteUrl('/servicos')}#${s.id}`,
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
          <p className="mt-4 text-base sm:text-lg text-aco-medio max-w-2xl leading-relaxed">
            Além da locação, fazemos terraplenagem com equipe e máquinas próprias.
          </p>
          {SERVICOS.length > 1 && (
          <nav aria-label="Serviços" className="mt-6 flex flex-wrap gap-2">
            {SERVICOS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-4 py-2 text-sm font-semibold text-aco bg-white border border-concreto rounded-[4px] hover:border-aco"
              >
                {s.nome}
              </a>
            ))}
          </nav>
          )}
        </div>
      </section>

      {SERVICOS.map((s, i) => (
        <section key={s.id} id={s.id} className={`py-16 sm:py-24 ${i % 2 ? 'bg-chapa' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className={`lg:col-span-6 ${i % 2 ? 'lg:order-2' : ''}`}>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">{s.nome}</h2>
              {s.paragrafos.map((p) => (
                <p key={p} className="mt-4 text-base text-aco-medio leading-relaxed">
                  {p}
                </p>
              ))}
              <ul className="mt-6 space-y-2.5">
                {s.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-aco">
                    <Check className="w-4 h-4 mt-0.5 text-liberado shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-aco-medio">{s.informe}</p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/orcamento?equipamento=${encodeURIComponent(`Serviço: ${s.nome}`)}`}
                  className="btn-acao px-6 py-3 text-sm"
                >
                  Pedir orçamento de {s.nome.toLowerCase()}
                </Link>
                {s.id === 'terraplenagem' && (
                  <Link
                    href={categoryPath('Equipamentos Compactos')}
                    className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-aco border-2 border-aco rounded-[4px] hover:bg-aco hover:text-white transition-colors"
                  >
                    Ver as máquinas
                  </Link>
                )}
              </div>
            </div>
            <div className={`lg:col-span-6 ${i % 2 ? 'lg:order-1' : ''}`}>
              <div className="relative aspect-[4/3] rounded-[6px] overflow-hidden bg-concreto">
                <Image src={s.imagem} alt={s.imagemAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
