import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Wrench, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import { getAboutPage } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Ícones dos destaques, na ordem
const CARD_ICONS = [Wrench, ShieldCheck, Award, CheckCircle2];

export const metadata: Metadata = {
  title: 'Empresa | EquiparLoc – Locação de Máquinas e Ferramentas',
  alternates: { canonical: '/empresa' },
  description: 'Conheça a EquiparLoc, nossa infraestrutura de oficina própria, frota revisada, rigor técnico e equipe de engenharia para locação de máquinas pesadas e ferramentas.',
};

export default function AboutPage() {
  const about = getAboutPage();
  // Parágrafos separados por linha em branco no painel
  const paragraphs = about.sectionText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-12 sm:py-16 bg-concreto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95] text-balance">{about.heroTitle}</h1>
            {about.heroText && <p className="text-base sm:text-lg text-aco-medio leading-relaxed">{about.heroText}</p>}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">{about.sectionTitle}</h2>
            {paragraphs.map((p, i) => (
              <p key={i} className="text-base text-aco-medio leading-relaxed whitespace-pre-line">
                {p}
              </p>
            ))}

            {about.cards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-concreto">
                {about.cards.map((card, i) => {
                  const Icon = CARD_ICONS[i % CARD_ICONS.length];
                  return (
                    <div key={i} className="p-4 bg-chapa rounded-[6px] border border-concreto">
                      <Icon className="w-5 h-5 text-laranja mb-2" aria-hidden="true" />
                      <h3 className="text-base font-bold text-aco">{card.title}</h3>
                      <p className="text-sm text-aco-medio mt-1">{card.text}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-[6px] overflow-hidden border border-concreto bg-concreto">
              <Image
                src={about.image}
                alt={about.imageAlt}
                width={1200}
                height={900}
                unoptimized={about.image.startsWith('/api/')}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="w-full h-auto max-h-[560px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-16 bg-chapa border-y border-concreto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">{about.pillarsTitle}</h2>
            {about.pillarsText && <p className="text-xs text-aco-medio mt-2">{about.pillarsText}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {about.pillars.map((pillar, i) => (
              <div key={i} className="bg-white p-6 rounded-[6px] border border-concreto">
                <h3 className="text-lg font-bold text-aco mt-1 mb-2">{pillar.title}</h3>
                <p className="text-sm text-aco-medio leading-relaxed">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-14 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">{about.ctaTitle}</h2>
        {about.ctaText && <p className="text-xs sm:text-sm text-aco-medio mt-2 mb-6">{about.ctaText}</p>}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          <Link
            href="/locacao"
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors"
          >
            <span>Explorar Catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold text-aco-medio bg-concreto hover:bg-[#D3D6D1] rounded-[4px] transition-colors"
          >
            Fale Conosco
          </Link>
        </div>
      </section>
    </main>
  );
}
