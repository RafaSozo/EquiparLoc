'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Equipment } from '@/lib/types';
import { EquipmentCard } from './EquipmentCard';
import { ArrowRight } from 'lucide-react';
import { fitCount, gridColsFor } from '@/lib/grid';

interface FeaturedEquipmentsProps {
  equipments: Equipment[];
  /** Categorias com itens (ordem do CRM) */
  categoryNames?: string[];
  /** Subcategoria → categoria principal (as abas mostram só as principais) */
  topCategoryOf?: Record<string, string>;
}

export function FeaturedEquipments({ equipments, categoryNames = [], topCategoryOf = {} }: FeaturedEquipmentsProps) {
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const topOf = (eq: Equipment) => topCategoryOf[eq.category] || eq.category;

  // Só mostra abas de categorias que têm itens em destaque
  const filterOptions = ['Todos', ...categoryNames.filter((name) => equipments.some((eq) => topOf(eq) === name))];

  const filtered = equipments.filter((eq) => {
    if (selectedFilter === 'Todos') return true;
    return topOf(eq) === selectedFilter;
  });

  return (
    <section className="py-16 sm:py-24 bg-white border-b border-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
              Destaques para locação
            </h2>
            <p className="text-base text-aco-medio mt-3 max-w-xl">
              Máquinas e ferramentas revisadas, com laudos de segurança em dia e pronta entrega.
            </p>
          </div>

          <Link
            href="/locacao"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco whitespace-nowrap"
          >
            Ver todo o catálogo
          </Link>
        </div>

        {/* Filter Tabs */}
        {filterOptions.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 text-xs">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelectedFilter(opt)}
              className={`px-3 py-1.5 rounded-[4px] text-sm font-medium transition-colors whitespace-nowrap ${
                selectedFilter === opt
                  ? 'bg-aco text-white'
                  : 'bg-chapa text-aco border border-concreto hover:border-aco'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        )}

        {/* Equipment Cards Grid */}
        {/* Quantidade que fecha as linhas: 6 (3x2), 4 (4x1), 3 ou menos */}
        <div className={`grid ${gridColsFor(fitCount(filtered.length), 'sm')} gap-6`}>
          {filtered.slice(0, fitCount(filtered.length)).map((equipment) => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
        </div>
      </div>
    </section>
  );
}
