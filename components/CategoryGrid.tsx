import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Hammer } from 'lucide-react';
import { CategoryWithCount, CategoryGroup, CATEGORY_GROUP_LABELS } from '@/lib/types';
import { categoryPath } from '@/lib/site';
import { gridColsFor } from '@/lib/grid';

interface CategoryGridProps {
  /** Categorias com itens ativos, cadastradas no CRM */
  categories: CategoryWithCount[];
}

function CategoryCard({ cat }: { cat: CategoryWithCount }) {
  return (
    <Link
      href={categoryPath(cat.name)}
      className="group relative bg-white border border-concreto rounded-[6px] overflow-hidden hover:border-aco transition-colors flex flex-col justify-between"
    >
      <div className={`relative w-full aspect-[16/10] overflow-hidden ${(cat.image || '').startsWith('/images/produtos/') ? 'bg-white' : 'bg-concreto'}`}>
        {cat.image ? (
          <Image
            src={cat.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className={(cat.image || '').startsWith('/images/produtos/') ? 'object-contain p-4' : 'object-cover object-center'}
          />
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

export function CategoryGrid({ categories }: CategoryGridProps) {
  const groups = (['maquinas', 'ferramentas'] as CategoryGroup[])
    .map((group) => ({ group, items: categories.filter((c) => c.group === group) }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;
  const showGroupTitles = groups.length > 1;

  return (
    <section className="py-16 sm:py-24 bg-chapa border-b border-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
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

        <div className="space-y-12">
          {groups.map(({ group, items }) => (
            <div key={group}>
              {showGroupTitles && (
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-aco">{CATEGORY_GROUP_LABELS[group]}</h3>
                  <Link
                    href={`/locacao?tipo=${group}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco whitespace-nowrap"
                  >
                    Ver todas as {CATEGORY_GROUP_LABELS[group].toLowerCase()}
                  </Link>
                </div>
              )}
              {/* Colunas conforme a quantidade: 4 grupos = 4 colunas, 6 = 3 colunas */}
              <div className={`grid ${gridColsFor(items.length)} gap-6`}>
                {items.map((cat) => (
                  <CategoryCard key={cat.id} cat={cat} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
