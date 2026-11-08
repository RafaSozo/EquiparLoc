'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FiboLiveSearch } from './search/FiboLiveSearch';
import { categoryPath } from '@/lib/site';

interface SearchFilterBarProps {
  /** Grupos de equipamentos com itens (vindos do painel) */
  groups: { name: string; count: number }[];
  /** Total de itens para locação */
  total: number;
}

/**
 * Faixa laranja logo abaixo da abertura: busca grande + atalhos para cada grupo.
 * Os atalhos são links de verdade (o Google segue e o visitante pode abrir em nova aba).
 */
/** 10 grupos = 2 colunas (tablet) e 5 (computador); 9 = 3 e 3; 8 = 2 e 4; senão 2 e 4/5. */
function linkCols(n: number): string {
  if (n % 5 === 0) return 'grid-cols-2 lg:grid-cols-5';
  if (n % 3 === 0 && n % 2 !== 0) return 'grid-cols-1 sm:grid-cols-3';
  if (n % 4 === 0) return 'grid-cols-2 lg:grid-cols-4';
  if (n % 3 === 0) return 'grid-cols-2 sm:grid-cols-3';
  return 'grid-cols-2 lg:grid-cols-5';
}

export function SearchFilterBar({ groups = [], total = 0 }: Partial<SearchFilterBarProps>) {
  return (
    <section aria-labelledby="busca-obra" className="bg-laranja text-aco">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          <div className="lg:col-span-4">
            <h2 id="busca-obra" className="type-display text-[2.5rem] sm:text-[2.75rem] leading-[0.95]">
              O que você precisa para a obra?
            </h2>
            <p className="mt-2 text-base font-medium text-aco/80">Busque pelo nome ou vá direto ao grupo.</p>
          </div>
          <div className="lg:col-span-8">
            <FiboLiveSearch mode="banner" placeholder="Betoneira, placa vibratória, martelo, gerador..." />
          </div>
        </div>

        <nav aria-label="Ir direto para um grupo de equipamentos" className="mt-8">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h3 className="text-sm font-bold">Ir direto para</h3>
            <Link
              href="/locacao"
              className="text-sm font-bold underline underline-offset-4 decoration-2 decoration-aco/40 hover:decoration-aco whitespace-nowrap"
            >
              Ver tudo ({total})
            </Link>
          </div>
          {/* Colunas conforme a quantidade de grupos, para não sobrar atalho sozinho na última linha */}
          <ul className={`grid ${linkCols(groups.length)} gap-2`}>
            {groups.map((g) => (
              <li key={g.name}>
                <Link
                  href={categoryPath(g.name)}
                  className="group flex items-center justify-between gap-2 h-full px-3.5 py-3 bg-white rounded-[4px] text-sm font-semibold leading-snug shadow-[0_1px_0_rgba(27,34,40,0.12)] hover:bg-aco hover:text-white transition-colors"
                >
                  <span>{g.name}</span>
                  <span className="flex items-center gap-1 shrink-0 text-xs font-medium text-aco-medio group-hover:text-[#C6CDD3]">
                    {g.count}
                    <ArrowRight className="w-3.5 h-3.5 -translate-x-0.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0 transition-all" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
