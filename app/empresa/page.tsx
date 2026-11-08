import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Wrench, Award, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Empresa | EquiparLoc – Locação de Máquinas e Ferramentas',
  alternates: { canonical: '/empresa' },
  description: 'Conheça a EquiparLoc, nossa infraestrutura de oficina própria, frota revisada, rigor técnico e equipe de engenharia para locação de máquinas pesadas e ferramentas.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative py-16 sm:py-20 bg-concreto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95] text-balance">
              A parceira estratégica para a engenharia da sua obra
            </h1>
            <p className="text-base sm:text-lg text-aco-medio leading-relaxed">
              Atuamos na locação de máquinas pesadas e ferramentas para obra com foco absoluto na disponibilidade operacional, conformidade com as normas regulamentadoras e pontualidade na mobilização.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">
              Pátio operacional estruturado e oficina técnica especializada
            </h2>
            <p className="text-base text-aco-medio leading-relaxed">
              A EquiparLoc conta com instalações dedicadas à manutenção preventiva e corretiva de equipamentos de grande porte.
            </p>
            <p className="text-base text-aco-medio leading-relaxed">
              Nosso compromisso não se encerra na entrega da máquina: mantemos monitoramento de telemetria contínuo, controle rigoroso de horímetro e equipes móveis de socorro mecânico para atender prontamente a qualquer intercorrência no canteiro.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-concreto">
              <div className="p-4 bg-chapa rounded-[6px] border border-concreto">
                <Wrench className="w-5 h-5 text-laranja mb-2" />
                <h3 className="text-base font-bold text-aco">Checklist de 40 Itens</h3>
                <p className="text-sm text-aco-medio mt-1">Inspecionamos pressão, filtros e freios antes de cada embarque.</p>
              </div>
              <div className="p-4 bg-chapa rounded-[6px] border border-concreto">
                <ShieldCheck className="w-5 h-5 text-laranja mb-2" />
                <h3 className="text-base font-bold text-aco">Conformidade NR</h3>
                <p className="text-sm text-aco-medio mt-1">Laudos vigentes de NR-11, NR-12 e NR-18 acompanham cada máquina.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative w-full h-[380px] sm:h-[460px] rounded-[6px] overflow-hidden border border-concreto">
              <Image
                src="/images/hero/hero-miniescavadeira-basculante.jpg"
                alt="Miniescavadeira e minidumper trabalhando em obra"
                fill
                className="object-cover"
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">
              Diretrizes de Atuação EquiparLoc
            </h2>
            <p className="text-xs text-aco-medio mt-2">
              Práticas e compromissos operacionais validados no dia a dia da construção pesada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[6px] border border-concreto">
              <h3 className="text-lg font-bold text-aco mt-1 mb-2">Produtividade Sem Paradas</h3>
              <p className="text-sm text-aco-medio leading-relaxed">
                Fornecer equipamentos em perfeito estado de conservação mecânica para que obras civis e industriais cumpram seus cronogramas com segurança e previsibilidade financeira.
              </p>
            </div>

            <div className="bg-white p-6 rounded-[6px] border border-concreto">
              <h3 className="text-lg font-bold text-aco mt-1 mb-2">Referência Técnica em Locação</h3>
              <p className="text-sm text-aco-medio leading-relaxed">
                Ser reconhecida pelos maiores contratantes e construtoras do país como o parceiro mais confiável e transparente no suporte a frotas pesadas.
              </p>
            </div>

            <div className="bg-white p-6 rounded-[6px] border border-concreto">
              <h3 className="text-lg font-bold text-aco mt-1 mb-2">Segurança em Primeiro Lugar</h3>
              <p className="text-sm text-aco-medio leading-relaxed">
                Vida humana e integridade operacional não são negociáveis. Nenhum equipamento sai do pátio sem certificação técnica e revisão aprovada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-14 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">
          Precisa de consultoria para a próxima etapa da sua obra?
        </h2>
        <p className="text-xs sm:text-sm text-aco-medio mt-2 mb-6">
          Nossa equipe de engenharia está pronta para analisar seus projetos e dimensionar os equipamentos ideais.
        </p>
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
