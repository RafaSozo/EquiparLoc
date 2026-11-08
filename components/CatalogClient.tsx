'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { Equipment, CategoryWithCount, CategoryGroup, ProductLineKind } from '@/lib/types';
import { EquipmentCard } from './EquipmentCard';
import { SuggestInput } from './search/SuggestInput';
import { Search, SlidersHorizontal, RotateCcw, PackageSearch, Filter } from 'lucide-react';
import Link from 'next/link';
import { categoryPath } from '@/lib/site';
import { categoryTree, namesInBranch, parentOf } from '@/lib/category-tree';

interface CatalogClientProps {
  initialEquipments: Equipment[];
  categories: CategoryWithCount[];
  /** Página de um grupo (/locacao/[categoria]): o grupo fica fixo e vem do endereço */
  fixedCategory?: CategoryWithCount;
  /** Linhas de produto (na ordem do painel) */
  lines?: { id: string; name: string; kind: ProductLineKind }[];
}

type GroupFilter = 'todos' | CategoryGroup;
const parseGroupIn = (ids: string[], v: string | null): GroupFilter => (v && ids.includes(v) ? v : 'todos');

export function CatalogClient({ initialEquipments, categories: categoryList, fixedCategory, lines = [] }: CatalogClientProps) {
  const lineIds = lines.map((l) => l.id);
  const parseGroup = (v: string | null) => parseGroupIn(lineIds, v);
  const lineLabel = (id: string) => lines.find((l) => l.id === id)?.name || id;
  // Página de uma categoria de serviço: textos sem "Locação de"
  const isServicePage = !!fixedCategory && lines.find((l) => l.id === fixedCategory.group)?.kind === 'servico';
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const resultsRef = useRef<HTMLDivElement>(null);
  const initialQuery = searchParams.get('q') || '';
  const initialGroup = fixedCategory ? 'todos' : parseGroup(searchParams.get('tipo'));

  const [search, setSearch] = useState(initialQuery);
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>(initialGroup);
  // O grupo de equipamentos agora é uma página própria (/locacao/[categoria]),
  // então ele vem do endereço e não muda dentro da página.
  const selectedCategory = fixedCategory?.name || 'Todas';
  const setSelectedCategory = (cat: string) => router.push(cat === 'Todas' ? '/locacao' : categoryPath(cat));
  const [selectedFuel, setSelectedFuel] = useState('Todos');
  const [selectedWeight, setSelectedWeight] = useState('Todos');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'name' | 'code'>('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const itemsPerPage = 9;

  // 1) Quando a URL muda (busca do cabeçalho, links do rodapé, botão Voltar),
  //    o catálogo acompanha em vez de ficar preso no filtro anterior.
  const urlKey = searchParams.toString();
  const [lastUrlKey, setLastUrlKey] = useState(urlKey);
  if (urlKey !== lastUrlKey) {
    setLastUrlKey(urlKey);
    const urlQuery = searchParams.get('q') || '';
    const urlGroup = fixedCategory ? 'todos' : parseGroup(searchParams.get('tipo'));
    if (urlQuery !== search || urlGroup !== selectedGroup) {
      setSearch(urlQuery);
      setSelectedGroup(urlGroup);
      setCurrentPage(1);
    }
  }

  // 2) Categoria e busca ficam gravadas na URL: dá para compartilhar o link
  //    filtrado e o botão Voltar do navegador funciona como esperado.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      params.delete('cat');
      if (search.trim()) params.set('q', search);
      else params.delete('q');
      if (selectedGroup !== 'todos') params.set('tipo', selectedGroup);
      else params.delete('tipo');
      const next = params.toString();
      const current = new URLSearchParams(window.location.search);
      if (next !== current.toString()) {
        const url = next ? `${pathname}?${next}` : pathname;
        // Troca de linha (máquinas/ferramentas) cria um passo no histórico;
        // digitação na busca apenas atualiza o endereço atual.
        if ((current.get('tipo') || 'todos') !== selectedGroup) router.push(url, { scroll: false });
        else router.replace(url, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedGroup, search, pathname, router]);

  // 3) Ao trocar de página na paginação, volta ao topo da lista.
  const goToPage = (page: number) => {
    setCurrentPage(page);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Linha de produto de cada categoria (máquinas / ferramentas)
  const groupOf = useMemo(() => {
    const map: Record<string, CategoryGroup> = {};
    categoryList.forEach((c) => (map[c.name] = c.group));
    return map;
  }, [categoryList]);
  const availableGroups = lineIds.filter((g) =>
    categoryList.some((c) => c.group === g)
  );
  // Principais seguidas das subcategorias, como no menu do WordPress
  const categoryRows = categoryTree(categoryList, selectedGroup === 'todos' ? undefined : selectedGroup, lineIds);
  const categories = ['Todas', ...categoryRows.map((r) => r.cat.name)];
  const rowOf = (name: string) => categoryRows.find((r) => r.cat.name === name);
  // Uma categoria principal mostra também os itens das subcategorias
  const branchNames = useMemo(
    () => (selectedCategory === 'Todas' ? null : namesInBranch(selectedCategory, categoryList)),
    [selectedCategory, categoryList]
  );
  const parentCategory = fixedCategory ? parentOf(fixedCategory, categoryList) : undefined;
  const itemsInGroup = initialEquipments.filter(
    (e) => selectedGroup === 'todos' || (groupOf[e.category] || 'maquinas') === selectedGroup
  );

  const selectGroup = (group: GroupFilter) => {
    setSelectedGroup(group);
    setCurrentPage(1);
  };

  const fuelTypes = ['Todos', 'Diesel S10', 'Elétrico a Bateria'];
  const weightRanges = ['Todos', 'Até 5 toneladas', '5t a 15 toneladas', 'Acima de 15 toneladas'];

  // Filter logic
  const filteredEquipments = useMemo(() => {
    return initialEquipments.filter((eq) => {
      // Linha de produto (máquinas / ferramentas)
      if (selectedGroup !== 'todos' && (groupOf[eq.category] || 'maquinas') !== selectedGroup) {
        return false;
      }

      // Category filter
      if (branchNames && !branchNames.has(eq.category)) {
        return false;
      }

      // Featured filter
      if (featuredOnly && !eq.isFeatured) {
        return false;
      }

      // Fuel filter
      if (selectedFuel !== 'Todos' && !eq.specs.fuelType.toLowerCase().includes(selectedFuel.toLowerCase().slice(0, 6))) {
        return false;
      }

      // Weight range filter
      if (selectedWeight !== 'Todos') {
        const weightNum = parseFloat(eq.specs.operatingWeight.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(weightNum)) {
          if (selectedWeight === 'Até 5 toneladas' && weightNum > 5000) return false;
          if (selectedWeight === '5t a 15 toneladas' && (weightNum <= 5000 || weightNum > 15000)) return false;
          if (selectedWeight === 'Acima de 15 toneladas' && weightNum <= 15000) return false;
        }
      }

      // Search term
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const matchName = eq.name.toLowerCase().includes(term);
        const matchCode = eq.code.toLowerCase().includes(term);
        const matchCat = eq.category.toLowerCase().includes(term);
        const matchSummary = eq.summary.toLowerCase().includes(term);
        const matchPower = eq.specs.power.toLowerCase().includes(term);
        const matchApps = eq.applications.some((app) => app.toLowerCase().includes(term));
        if (!matchName && !matchCode && !matchCat && !matchSummary && !matchPower && !matchApps) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      // default: featured first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [initialEquipments, selectedGroup, groupOf, branchNames, featuredOnly, selectedFuel, selectedWeight, search, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage) || 1;
  const paginatedEquipments = filteredEquipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedGroup('todos');
    setSelectedFuel('Todos');
    setSelectedWeight('Todos');
    setFeaturedOnly(false);
    setSortBy('featured');
    setCurrentPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header info */}
      <div className="mb-8 border-b border-concreto pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {fixedCategory && (
              <nav aria-label="Caminho" className="mb-3 text-xs text-aco-medio">
                <Link href={isServicePage ? '/servicos' : '/locacao'} className="hover:text-aco underline underline-offset-2">
                  {isServicePage ? 'Serviços' : 'Locação'}
                </Link>
                <span aria-hidden="true"> / </span>
                {parentCategory && (
                  <>
                    <Link href={categoryPath(parentCategory.name)} className="hover:text-aco underline underline-offset-2">
                      {parentCategory.name}
                    </Link>
                    <span aria-hidden="true"> / </span>
                  </>
                )}
                <span className="text-aco font-semibold">{fixedCategory.name}</span>
              </nav>
            )}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
              {fixedCategory
                ? isServicePage
                  ? fixedCategory.name
                  : `Locação de ${fixedCategory.name}`
                : selectedGroup !== 'todos'
                  ? `Locação de ${lineLabel(selectedGroup)}`
                  : 'Locação de Máquinas e Ferramentas'}
            </h1>
            <p className="text-base text-aco-medio mt-3 max-w-2xl">
              {fixedCategory?.description || 'Veja a ficha técnica de cada item e peça o orçamento direto daqui.'}
            </p>
            {!fixedCategory && availableGroups.length > 1 && (
              <div role="tablist" aria-label="Linha de produto" className="mt-4 inline-flex p-1 bg-concreto rounded-[4px] gap-1">
                {(['todos', ...availableGroups] as GroupFilter[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="tab"
                    aria-selected={selectedGroup === g}
                    onClick={() => selectGroup(g)}
                    className={` px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      selectedGroup === g ? 'bg-white text-aco shadow-xs' : 'text-aco-medio hover:text-aco'
                    }`}
                  >
                    {g === 'todos' ? 'Tudo' : lineLabel(g)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-aco-medio whitespace-nowrap">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'featured' | 'name' | 'code')}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-[4px] bg-white text-aco focus:outline-none focus:ring-1 focus:ring-[#FF6500]"
            >
              <option value="featured">Destaques da frota</option>
              <option value="name">Nome do equipamento (A-Z)</option>
              <option value="code">Código de referência</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1">
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="w-full flex items-center justify-between p-3 bg-concreto rounded-[4px] text-xs font-semibold text-aco"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-laranja" />
                <span>Filtros avançados</span>
              </span>
              <span>{mobileFilterOpen ? 'Ocultar' : 'Expandir'}</span>
            </button>
          </div>

          <div className={` space-y-6 ${mobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Search Box */}
            <div className="bg-white border border-concreto rounded-[6px] p-4 shadow-xs">
              <label className="block text-sm font-bold text-aco mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aco-medio" />
                <SuggestInput
                  aria-label="Buscar no catálogo"
                  value={search}
                  onValueChange={(v) => {
                    setSearch(v);
                    setCurrentPage(1);
                  }}
                  onSuggestionSelect={(s) => router.push(s.href)}
                  placeholder="Betoneira, martelete, gerador..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-concreto rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                />
              </div>
            </div>

            {/* Categories Filter */}
            <div className="bg-white border border-concreto rounded-[6px] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-aco">
                  Categoria
                </label>
                {selectedCategory !== 'Todas' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('Todas');
                      setCurrentPage(1);
                    }}
                    className="text-[11px] text-laranja-texto hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {categories.map((cat) => {
                  const row = rowOf(cat);
                  return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={` w-full text-left py-1.5 rounded-[4px] text-xs transition-colors flex items-center justify-between ${
                      row?.depth ? 'pl-6 pr-2.5' : 'px-2.5'
                    } ${
                      selectedCategory === cat
                        ? 'bg-aco text-white font-medium'
                        : 'text-aco-medio hover:bg-chapa hover:text-aco'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="text-[10px] opacity-60 ml-2">
                      {cat === 'Todas' ? itemsInGroup.length : row?.cat.count ?? 0}
                    </span>
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Characteristics Filters */}
            <div className="bg-white border border-concreto rounded-[6px] p-4 shadow-xs space-y-4">
              <div>
                <label className="block text-sm font-bold text-aco mb-2">
                  Motor
                </label>
                <div className="space-y-1">
                  {fuelTypes.map((fuel) => (
                    <label key={fuel} className="flex items-center gap-2 text-xs text-aco-medio cursor-pointer py-0.5">
                      <input
                        type="radio"
                        name="fuel"
                        checked={selectedFuel === fuel}
                        onChange={() => {
                          setSelectedFuel(fuel);
                          setCurrentPage(1);
                        }}
                        className="w-3.5 h-3.5 text-laranja border-slate-300 focus:ring-[#FF6500]"
                      />
                      <span>{fuel}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-concreto">
                <label className="block text-sm font-bold text-aco mb-2">
                  Peso operacional
                </label>
                <div className="space-y-1">
                  {weightRanges.map((w) => (
                    <label key={w} className="flex items-center gap-2 text-xs text-aco-medio cursor-pointer py-0.5">
                      <input
                        type="radio"
                        name="weight"
                        checked={selectedWeight === w}
                        onChange={() => {
                          setSelectedWeight(w);
                          setCurrentPage(1);
                        }}
                        className="w-3.5 h-3.5 text-laranja border-slate-300 focus:ring-[#FF6500]"
                      />
                      <span>{w}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-concreto">
                <label className="flex items-center gap-2 text-xs text-aco-medio cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={(e) => {
                      setFeaturedOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-3.5 h-3.5 rounded text-laranja border-slate-300 focus:ring-[#FF6500]"
                  />
                  <span className="font-medium">Apenas itens em destaque</span>
                </label>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-aco-medio bg-concreto hover:bg-[#D3D6D1] rounded-[4px] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar todos os filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Equipment Grid */}
        <div ref={resultsRef} className="lg:col-span-3 scroll-mt-28">
          {/* Active criteria count */}
          <div className="flex items-center justify-between text-xs text-aco-medio mb-4 px-1">
            <span>
              Exibindo <strong>{filteredEquipments.length}</strong> de <strong>{initialEquipments.length}</strong> itens disponíveis
            </span>
            {(selectedCategory !== 'Todas' || selectedGroup !== 'todos' || search || selectedFuel !== 'Todos' || selectedWeight !== 'Todos' || featuredOnly) && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-laranja-texto hover:underline font-medium"
              >
                Limpar filtros aplicados
              </button>
            )}
          </div>

          {filteredEquipments.length === 0 && selectedGroup === 'ferramentas' && !availableGroups.includes('ferramentas') ? (
            /* Linha de ferramentas ainda sem itens publicados */
            <div className="bg-white border border-concreto rounded-[6px] p-10 space-y-4">
              <h2 className="text-lg font-bold text-aco">Catálogo de ferramentas em montagem</h2>
              <p className="text-sm text-aco-medio max-w-lg">
                Já alugamos ferramentas para obra, mas os modelos ainda não estão publicados aqui. Diga o que você
                precisa e nossa equipe confirma a disponibilidade.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/orcamento"
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors"
                >
                  Pedir orçamento de ferramentas
                </a>
                <button
                  type="button"
                  onClick={() => selectGroup('todos')}
                  className="inline-flex items-center px-4 py-2 text-xs font-semibold text-aco-medio bg-concreto hover:bg-[#D3D6D1] rounded-[4px] transition-colors"
                >
                  Ver máquinas disponíveis
                </button>
              </div>
            </div>
          ) : filteredEquipments.length === 0 ? (
            /* Empty State */
            <div className="bg-chapa border-2 border-dashed border-concreto rounded-[6px] p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-concreto text-aco-medio mx-auto flex items-center justify-center">
                <PackageSearch className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-aco">
                  Nenhum item encontrado com esses filtros
                </h3>
                <p className="text-xs text-aco-medio max-w-sm mx-auto">
                  Tente ajustar os filtros de categoria, faixa de peso ou termo de busca para visualizar mais opções da frota.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ver o catálogo completo</span>
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedEquipments.map((eq) => (
                  <EquipmentCard key={eq.id} equipment={eq} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 pt-6 border-t border-concreto flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-[4px] hover:bg-chapa disabled:opacity-40"
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={`page-${i + 1}`}
                      type="button"
                      onClick={() => goToPage(i + 1)}
                      aria-current={currentPage === i + 1 ? 'page' : undefined}
                      className={` w-8 h-8 text-xs font-medium rounded-[4px] transition-colors ${
                        currentPage === i + 1
                          ? 'bg-laranja text-aco font-bold'
                          : 'text-aco-medio hover:bg-chapa'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-[4px] hover:bg-chapa disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
