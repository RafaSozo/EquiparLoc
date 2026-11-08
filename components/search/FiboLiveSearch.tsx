'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Clock,
  TrendingUp,
  Truck,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { useQuoteModal } from '@/lib/quote-modal-context';
import { equipmentPath } from '@/lib/site';

interface SearchEquipment {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: string;
  image: string;
  summary: string;
  specs: {
    operatingWeight: string;
    power: string;
    bucketCapacity?: string;
    maxReach?: string;
    fuelType: string;
  };
  availability: 'disponivel' | 'sob_consulta' | 'em_operacao';
  matchedHighlights: string[];
}

/** Valor de ficha que vale mostrar (não "Sob consulta" etc.) */
const realSpec = (v?: string) => !!v && !/consulta|não se aplica|usa motor|sistema hidráulico|conforme o motor/i.test(v);

interface SearchBlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  readTime: string;
  publishedAt: string;
  image: string;
  summary: string;
  matchedHighlights: string[];
}

interface FiboSearchResult {
  query: string;
  total: number;
  equipments: SearchEquipment[];
  blogPosts: SearchBlogPost[];
  suggestions: string[];
}

interface FiboLiveSearchProps {
  mode?: 'header' | 'modal' | 'banner';
  placeholder?: string;
  autoFocus?: boolean;
  isOpenModal?: boolean;
  onCloseModal?: () => void;
}

export function FiboLiveSearch({
  mode = 'header',
  placeholder = 'Buscar por modelo, categoria, potência ou código (ex: betoneira, 5,5 kVA, EQ-MAR-060)...',
  autoFocus = false,
  isOpenModal = false,
  onCloseModal,
}: FiboLiveSearchProps) {
  const router = useRouter();
  const { openQuoteModal } = useQuoteModal();

  const [query, setQuery] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = mode === 'modal' ? Boolean(isOpenModal) : internalOpen;
  const setIsOpen = (val: boolean) => {
    setInternalOpen(val);
  };

  const [activeTab, setActiveTab] = useState<'all' | 'equipment' | 'blog'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FiboSearchResult | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('equipar_fibo_searches');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (mode === 'modal' && isOpenModal) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [mode, isOpenModal]);

  const saveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem('equipar_fibo_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== term);
      setRecentSearches(updated);
      localStorage.setItem('equipar_fibo_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = () => {
    try {
      setRecentSearches([]);
      localStorage.removeItem('equipar_fibo_searches');
    } catch {
      // ignore
    }
  };

  // Perform live search query
  const executeSearch = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (res.ok) {
        const data: FiboSearchResult = await res.json();
        setResults(data);
        setSelectedIndex(-1);
      }
    } catch (err) {
      console.error('FiboSearch fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      executeSearch(val);
    }, 180);
  };

  // Handle Enter / submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query);
    setIsOpen(false);
    if (onCloseModal) onCloseModal();
    router.push(`/locacao?q=${encodeURIComponent(query.trim())}`);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mode !== 'modal' && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  // Keyboard navigation
  const allNavigableItems = React.useMemo(() => {
    if (!results) return [];
    if (activeTab === 'equipment') return results.equipments.map((eq) => ({ type: 'eq', item: eq }));
    if (activeTab === 'blog') return results.blogPosts.map((p) => ({ type: 'post', item: p }));
    return [
      ...results.equipments.map((eq) => ({ type: 'eq', item: eq })),
      ...results.blogPosts.map((p) => ({ type: 'post', item: p })),
    ];
  }, [results, activeTab]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (onCloseModal) onCloseModal();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allNavigableItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allNavigableItems.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < allNavigableItems.length) {
        e.preventDefault();
        const selected = allNavigableItems[selectedIndex];
        saveRecentSearch(query);
        setIsOpen(false);
        if (onCloseModal) onCloseModal();

        if (selected.type === 'eq') {
          const eq = selected.item as SearchEquipment;
          router.push(equipmentPath(eq));
        } else {
          const post = selected.item as SearchBlogPost;
          router.push(`/blog/${post.slug}`);
        }
      }
    }
  };

  // Highlight helper
  const highlightMatch = (text: string, term: string) => {
    if (!term || !term.trim()) return text;
    const cleanTerm = term.trim();
    const regex = new RegExp(`(${cleanTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-laranja/30 text-aco font-bold px-0.5 rounded-[2px]">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleQuoteClick = (eq: SearchEquipment, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onCloseModal) onCloseModal();
    openQuoteModal(eq as unknown as import('@/lib/types').Equipment);
  };

  const isModal = mode === 'modal';
  // Faixa laranja da página inicial: campo maior, botão escuro para contrastar com o laranja
  const isBanner = mode === 'banner';

  return (
    <div
      ref={containerRef}
      className={` relative w-full ${isModal ? 'max-w-3xl mx-auto' : ''}`}
    >
      {/* Search Input Box */}
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <div className="relative flex items-center">
          <div className={`absolute pointer-events-none flex items-center justify-center ${isBanner ? 'left-4' : 'left-3.5'}`}>
            {loading ? (
              <Loader2 className="w-4 h-4 text-laranja animate-spin" />
            ) : (
              <Search className={`text-aco-medio transition-colors ${isBanner ? 'w-5 h-5' : 'w-4 h-4'}`} />
            )}
          </div>

          <input
            aria-label="Buscar máquinas, modelos ou artigos"
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsOpen(true);
              if (!results) executeSearch(query);
            }}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            placeholder={placeholder}
            className={`w-full border rounded-[6px] transition-all outline-none text-aco placeholder:text-slate-500 ${
              isBanner
                ? `pl-12 pr-32 py-4 text-base bg-white shadow-[0_10px_30px_-12px_rgba(27,34,40,0.45)] ${isOpen ? 'border-aco ring-2 ring-aco/25' : 'border-white'}`
                : `pl-10 pr-20 py-2.5 text-xs sm:text-sm bg-chapa hover:bg-white focus:bg-white shadow-xs ${isOpen ? 'border-laranja ring-2 ring-[#FF6500]/20' : 'border-concreto hover:border-slate-300'}`
            }`}
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  executeSearch('');
                  inputRef.current?.focus();
                }}
                className="p-1 text-aco-medio hover:text-aco-medio hover:bg-chapa rounded-md transition-colors"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {isBanner ? (
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-aco hover:bg-[#2A333B] rounded-[4px] transition-colors"
              >
                Buscar
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                className="p-1.5 text-xs font-semibold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors shadow-xs"
                title="Buscar"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Live Dropdown / Modal Overlay */}
      {isOpen && (
        <div
          className={` absolute z-50 bg-white ${mode === 'header' ? 'right-0 w-[min(40rem,calc(100vw-2rem))]' : 'left-0 right-0'} rounded-[6px] shadow-2xl border border-concreto mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            isModal ? 'max-h-[80vh] flex flex-col' : 'max-h-[580px] flex flex-col'
          }`}
        >
          {/* Top Tabs (when results available) */}
          {results && (
            <div className="bg-chapa border-b border-concreto px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={` px-3 py-1.5 rounded-[4px] font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-aco text-white shadow-xs'
                      : 'text-aco-medio hover:bg-slate-200/60'
                  }`}
                >
                  <span>Todos</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-[4px] bg-white/10 text-white">
                    {results.equipments.length + results.blogPosts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('equipment')}
                  className={` px-3 py-1.5 rounded-[4px] font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'equipment'
                      ? 'bg-aco text-white shadow-xs'
                      : 'text-aco-medio hover:bg-slate-200/60'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-laranja" />
                  <span>Máquinas & Frota</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-[4px] bg-white/10 text-white">
                    {results.equipments.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('blog')}
                  className={` px-3 py-1.5 rounded-[4px] font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'blog'
                      ? 'bg-aco text-white shadow-xs'
                      : 'text-aco-medio hover:bg-slate-200/60'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Artigos & Manuais</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-[4px] bg-white/10 text-white">
                    {results.blogPosts.length}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="overflow-y-auto flex-1 divide-y divide-concreto p-2 sm:p-3 space-y-4">
            {/* Case A: Query empty -> Show Recent searches + Popular machinery */}
            {!query.trim() && (
              <div className="space-y-4 p-2">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-aco-medio flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-laranja" />
                        <span>Suas Buscas Recentes</span>
                      </span>
                      <button
                        type="button"
                        onClick={clearAllRecent}
                        className="text-[11px] text-aco-medio hover:text-aco-medio underline"
                      >
                        Limpar histórico
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <div
                          key={term}
                          onClick={() => {
                            setQuery(term);
                            executeSearch(term);
                          }}
                          className="group inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-concreto hover:bg-chapa border border-concreto hover:border-laranja/40 text-aco-medio hover:text-laranja-texto rounded-[4px] cursor-pointer transition-colors"
                        >
                          <span>{term}</span>
                          <button
                            type="button"
                            onClick={(e) => removeRecentSearch(term, e)}
                            className="text-aco-medio hover:text-aco-medio"
                            title="Remover"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches in EquiparLoc */}
                <div>
                  <span className="text-xs font-bold text-aco-medio flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-laranja" />
                    <span>Equipamentos Mais Buscados</span>
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {[
                      'Betoneira 400 litros',
                      'Placa vibratória',
                      'Martelo demolidor',
                      'Gerador de energia',
                      'Minicarregadeira',
                      'Cortadora de piso',
                      'Motobomba',
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          executeSearch(term);
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-chapa border border-concreto hover:border-laranja text-aco-medio hover:text-laranja-texto rounded-[4px] transition-all text-left shadow-xs flex items-center gap-1.5"
                      >
                        <span>{term}</span>
                        <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Case B: Query active -> Render Results */}
            {query.trim() && results && (
              <>
                {/* 1. Equipment Results */}
                {(activeTab === 'all' || activeTab === 'equipment') && results.equipments.length > 0 && (
                  <div className="space-y-2">
                    <div className="px-2 pt-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-aco-medio flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-laranja" />
                        <span>Frota & Máquinas Pesadas ({results.equipments.length})</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {results.equipments.map((eq, idx) => {
                        const isFocused = selectedIndex === idx;
                        return (
                          <div
                            key={eq.id}
                            onClick={() => {
                              saveRecentSearch(query);
                              setIsOpen(false);
                              if (onCloseModal) onCloseModal();
                              router.push(equipmentPath(eq));
                            }}
                            className={` group p-2.5 sm:p-3 rounded-[6px] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isFocused
                                ? 'bg-chapa border-aco'
                                : 'bg-white hover:bg-slate-50/90 border-concreto hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Machine Image */}
                              <div className="relative w-16 h-14 sm:w-20 sm:h-16 rounded-[4px] overflow-hidden bg-white shrink-0 border border-concreto">
                                <Image
                                  src={eq.image}
                                  alt={eq.name}
                                  fill
                                  sizes="80px"
                                  className="object-contain p-1"
                                  referrerPolicy="no-referrer"
                                />
                              </div>

                              {/* Machine Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-concreto text-aco">
                                    {eq.code}
                                  </span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-[4px] bg-chapa text-aco border border-concreto">
                                    {eq.category}
                                  </span>
                                </div>

                                <h4 className="text-base sm:text-lg font-bold leading-snug text-aco group-hover:text-laranja-texto transition-colors line-clamp-2">
                                  {highlightMatch(eq.name, query)}
                                </h4>

                                {/* Key Specs Pill Bar */}
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-aco-medio flex-wrap">
                                  {realSpec(eq.specs.operatingWeight) && (
                                    <span className="bg-concreto px-1.5 py-0.5 rounded text-aco-medio">
                                      Peso: <strong className="font-semibold text-aco">{eq.specs.operatingWeight}</strong>
                                    </span>
                                  )}
                                  {realSpec(eq.specs.power) && (
                                    <span className="bg-concreto px-1.5 py-0.5 rounded text-aco-medio">
                                      Potência: <strong className="font-semibold text-aco">{eq.specs.power}</strong>
                                    </span>
                                  )}
                                  {eq.specs.bucketCapacity && (
                                    <span className="hidden sm:inline bg-concreto px-1.5 py-0.5 rounded text-aco-medio">
                                      Caçamba: {eq.specs.bucketCapacity}
                                    </span>
                                  )}
                                  {eq.specs.maxReach && (
                                    <span className="hidden sm:inline bg-concreto px-1.5 py-0.5 rounded text-aco-medio">
                                      Alcance: {eq.specs.maxReach}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Pricing & Fast CTAs */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-concreto shrink-0">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleQuoteClick(eq, e)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-aco bg-laranja hover:bg-laranja-escuro rounded-md transition-colors shadow-xs flex items-center gap-1"
                                >
                                  <FileSpreadsheet className="w-3 h-3" />
                                  <span>Cotar</span>
                                </button>

                                <span className="p-1 text-aco-medio group-hover:text-laranja-texto transition-colors">
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Blog & Technical Guides Results */}
                {(activeTab === 'all' || activeTab === 'blog') && results.blogPosts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="px-2 pt-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-aco-medio flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#F5A623]" />
                        <span>Artigos Técnicos & Manuais ({results.blogPosts.length})</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {results.blogPosts.map((post) => (
                        <div
                          key={post.id}
                          onClick={() => {
                            saveRecentSearch(query);
                            setIsOpen(false);
                            if (onCloseModal) onCloseModal();
                            router.push(`/blog/${post.slug}`);
                          }}
                          className="group p-2.5 sm:p-3 rounded-[6px] border border-concreto hover:border-slate-300 bg-white hover:bg-chapa transition-all cursor-pointer flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-12 h-12 rounded-[4px] overflow-hidden bg-concreto shrink-0 border border-concreto">
                              <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                sizes="50px"
                                className="object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5 text-xs">
                                <span className="font-semibold text-aco bg-chapa border border-concreto px-1.5 py-0.5 rounded-[4px]">
                                  {post.category}
                                </span>
                                <span className="text-aco-medio">{post.readTime}</span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-semibold text-aco group-hover:text-laranja-texto line-clamp-1">
                                {highlightMatch(post.title, query)}
                              </h4>
                              <p className="text-[11px] text-aco-medio line-clamp-1">{post.summary}</p>
                            </div>
                          </div>

                          <div className="shrink-0 p-1 text-aco-medio group-hover:text-laranja-texto">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Empty state */}
                {results.equipments.length === 0 && results.blogPosts.length === 0 && (
                  <div className="text-center py-8 px-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-concreto text-aco-medio flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-aco">
                        Nenhum resultado exato para &quot;{query}&quot;
                      </h4>
                      <p className="text-xs text-aco-medio max-w-md mx-auto mt-1">
                        Tente palavras-chave mais genéricas como <span className="font-semibold text-aco-medio">escavadeira</span>,{' '}
                        <span className="font-semibold text-aco-medio">gerador</span>,{' '}
                        <span className="font-semibold text-aco-medio">martelo</span> ou solicite um maquinário especial diretamente à nossa equipe técnica.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          if (onCloseModal) onCloseModal();
                          openQuoteModal();
                        }}
                        className="px-4 py-2 text-xs font-semibold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors shadow-xs"
                      >
                        Solicitar Orçamento Especial
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Footer Bar */}
          <div className="bg-chapa border-t border-concreto px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-aco-medio">
              <span className="text-aco-medio">Equipamentos revisados e testados</span>
            </div>

            <button
              type="button"
              onClick={() => {
                saveRecentSearch(query);
                setIsOpen(false);
                if (onCloseModal) onCloseModal();
                router.push(`/locacao${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
              }}
              className="text-xs font-bold text-laranja-texto hover:text-aco flex items-center gap-1 transition-colors"
            >
              <span>Ver catálogo completo</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
