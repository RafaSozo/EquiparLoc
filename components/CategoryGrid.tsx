'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Hammer } from 'lucide-react';
import type { CategoryWithCount } from '@/lib/types';
import { categoryPath } from '@/lib/site';
import { PhotoWithLoader } from './PhotoWithLoader';
import { evenCount, EVEN_GRID } from '@/lib/grid';

interface CategoryGridProps {
  /** Categorias com itens ativos, cadastradas no CRM */
  categories: CategoryWithCount[];
  /** Linhas de locação na ordem do painel */
  lines: { id: string; name: string }[];
}

/** Um grupo (linha de produto): no máximo 2 linhas cheias de cards e o botão "Ver mais". */
function CategoryGroup({ group, name, items, showTitle }: { group: string; name: string; items: CategoryWithCount[]; showTitle: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const limit = evenCount(items.length);
  const shown = expanded ? items : items.slice(0, limit);
  const hidden = items.length - limit;
  const listId = `categorias-${group}`;

  return (
    <div>
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <h3 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">{name}</h3>
          <Link
            href={`/locacao?tipo=${group}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco whitespace-nowrap"
          >
            Ver tudo em {name}
          </Link>
        </div>
      )}
      {/* Todos os cards do mesmo tamanho: 3 colunas no computador e no tablet */}
      <div id={listId} className={`grid ${EVEN_GRID} gap-6`}>
        {shown.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} />
        ))}
      </div>
      {hidden > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={listId}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-aco border-2 border-aco rounded-[4px] hover:bg-aco hover:text-white transition-colors"
          >
            {expanded ? 'Ver menos' : `Ver mais (${hidden})`}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategoryWithCount }) {
  return (
    <Link
      href={categoryPath(cat.name)}
      className="group relative bg-white border border-concreto rounded-[6px] overflow-hidden hover:border-aco transition-colors flex flex-col justify-between"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-white border-b border-concreto">
        {cat.image ? (
          <PhotoWithLoader src={cat.image} alt="" sizes="(min-width: 768px) 33vw, 100vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Hammer className="w-12 h-12 text-aco-medio" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-aco group-hover:underline underline-offset-4 decoration-laranja decoration-2">
            {cat.name}
          </h4>
          {cat.description && (
            <p className="text-sm text-aco-medio mt-1.5 line-clamp-2 leading-relaxed">{cat.description}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="type-display block text-[2rem] text-aco">{cat.count}</span>
          <span className="text-xs text-aco-medio">{cat.count === 1 ? 'modelo' : 'modelos'}</span>
        </div>
      </div>
    </Link>
  );
}

export function CategoryGrid({ categories, lines }: CategoryGridProps) {
  const groups = lines
    .map((line) => ({ group: line.id, name: line.name, items: categories.filter((c) => c.group === line.id) }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;
  const showGroupTitles = groups.length > 1;

  return (
    <section className="py-12 sm:py-16 bg-chapa border-b border-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
              {showGroupTitles ? 'Máquinas e ferramentas para a sua obra' : 'Categorias de equipamentos'}
            </h2>
            <p className="text-base text-aco-medio mt-3">Escolha uma categoria para ver os modelos e pedir orçamento.</p>
          </div>
          <Link
            href="/locacao"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco whitespace-nowrap"
          >
            Ver toda a locação
          </Link>
        </div>

        <div className="space-y-14">
          {groups.map(({ group, name, items }) => (
            <CategoryGroup key={group} group={group} name={name} items={items} showTitle={showGroupTitles} />
          ))}
        </div>
      </div>
    </section>
  );
}
