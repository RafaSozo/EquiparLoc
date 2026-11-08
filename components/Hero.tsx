'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, List } from 'lucide-react';
import { useQuoteModal } from '@/lib/quote-modal-context';
import type { Equipment, HeroSettings } from '@/lib/types';
import { keySpec, isReadyToShip } from '@/lib/spec';
import { equipmentPath } from '@/lib/site';
import { RentalCalendar } from './RentalCalendar';

interface HeroProps {
  /** Textos e foto definidos no painel */
  hero: HeroSettings;
  /** Itens em destaque mostrados no quadro do pátio */
  boardItems: Equipment[];
  /** Total de itens ativos no catálogo */
  totalItems: number;
}

const FOCUS: Record<HeroSettings['focus'], string> = {
  left: '20% 50%',
  center: '50% 50%',
  right: '80% 50%',
};

export function Hero({ hero, boardItems = [], totalItems = 0 }: HeroProps) {
  const { openQuoteModal } = useQuoteModal();
  const rows = hero.showBoard ? boardItems.slice(0, 4) : [];
  // O quadro mostra os equipamentos; o botão do topo troca para o calendário de datas
  const [showDates, setShowDates] = useState(false);

  return (
    <section className="relative isolate overflow-hidden bg-aco text-white border-b border-aco">
      {/* Foto de obra em largura total; ao carregar, ela "assenta" devagar (única animação da página) */}
      <Image
        src={hero.image}
        alt={hero.imageAlt}
        fill
        priority
        sizes="100vw"
        className="hero-foto -z-20 object-cover"
        style={{ objectPosition: FOCUS[hero.focus] }}
      />
      {/* Escurecimento: forte à esquerda (onde fica o texto), leve à direita para a foto aparecer */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,20,24,0.55)_0%,rgba(15,20,24,0.88)_100%)] lg:bg-[linear-gradient(90deg,rgba(15,20,24,0.92)_0%,rgba(15,20,24,0.78)_38%,rgba(15,20,24,0.25)_75%,rgba(15,20,24,0.1)_100%)]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[clamp(34rem,calc(100svh-8rem),46rem)] py-14 lg:py-20">
        {/* Mensagem */}
        <div className="lg:col-span-7">
          <h1>
            <span className="block text-base sm:text-lg font-semibold text-[#FFB27A] [font-stretch:100%] tracking-normal">
              {hero.eyebrow}
            </span>
            <span className="type-display block mt-3 text-white text-[clamp(3.25rem,8vw,6.25rem)] text-balance [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
              {hero.title}
            </span>
          </h1>

          <p className="mt-6 text-lg text-[#D5DBE0] max-w-[36rem] leading-relaxed">{hero.text}</p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => openQuoteModal()} className="btn-acao px-6 py-3.5 text-base">
              {hero.primaryLabel}
            </button>
            <Link
              href="/locacao"
              className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white border-2 border-white/80 rounded-[4px] hover:bg-white hover:text-aco transition-colors"
            >
              {hero.secondaryLabel}
            </Link>
          </div>
        </div>

        {/* Quadro do pátio: placa rebitada sobre a foto */}
        {rows.length > 0 && (
          <div className="lg:col-span-5 lg:justify-self-end w-full lg:max-w-[30rem]">
            <div
              className="placa bg-aco/95 text-white px-5 sm:px-6 pt-5 pb-4 ring-1 ring-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]"
              style={{ ['--rebite' as string]: '#56626C' }}
            >
              <div className="flex items-center justify-between gap-3 px-2">
                <h2 className="type-display text-2xl">{showDates ? 'Quando você precisa?' : 'Quadro do pátio'}</h2>
                <button
                  type="button"
                  onClick={() => setShowDates((v) => !v)}
                  aria-expanded={showDates}
                  aria-controls="quadro-patio-conteudo"
                  className={`inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 text-sm font-semibold rounded-[4px] transition-colors ${
                    showDates
                      ? 'text-white border border-white/40 hover:bg-white/10'
                      : 'text-aco bg-laranja hover:bg-laranja-escuro'
                  }`}
                >
                  {showDates ? (
                    <>
                      <List className="w-4 h-4" aria-hidden="true" />
                      Ver equipamentos
                    </>
                  ) : (
                    <>
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                      Separar datas
                    </>
                  )}
                </button>
              </div>

              <div id="quadro-patio-conteudo">
                <AnimatePresence mode="wait" initial={false}>
                  {showDates ? (
                    <motion.div
                      key="datas"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                      className="mt-2 pb-1"
                    >
                      <RentalCalendar embedded />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="quadro"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                    >
                      <ul className="mt-3 divide-y divide-white/10">
                        {rows.map((eq) => {
                          const spec = keySpec(eq);
                          const ready = isReadyToShip(eq);
                          return (
                            <li key={eq.id} className="flex items-center gap-3 sm:gap-4 py-2.5 px-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={equipmentPath(eq)}
                                  className="block text-sm font-semibold text-white hover:text-laranja leading-snug line-clamp-2"
                                >
                                  {eq.name}
                                </Link>
                                <span className="block text-xs text-[#B9C1C8] truncate">
                                  {eq.code}
                                  {ready && <span className="text-[#7FD3A2]"> / pronta entrega</span>}
                                </span>
                              </div>
                              <div className="text-right shrink-0" title={spec.label}>
                                <span className="type-display text-[1.75rem] leading-none">{spec.value}</span>
                                <span className="ml-1 text-sm text-[#B9C1C8]">{spec.unit}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => openQuoteModal(eq)}
                                className="btn-acao shrink-0 px-3 py-1.5 text-sm"
                                aria-label={`Pedir orçamento: ${eq.name}`}
                              >
                                Orçar
                              </button>
                            </li>
                          );
                        })}
                      </ul>

                      <Link
                        href="/locacao"
                        className="mt-2 inline-block px-2 text-sm font-semibold text-white underline underline-offset-4 decoration-laranja hover:text-laranja"
                      >
                        Ver os {totalItems} itens para locação
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
