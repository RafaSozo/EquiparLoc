'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { SuggestInput } from '../search/SuggestInput';
import { Search, Clock, User, Eye, MessageSquare, ArrowRight, X, Tag } from 'lucide-react';

interface BlogCatalogClientProps {
  posts: BlogPost[];
}

export function BlogCatalogClient({ posts }: BlogCatalogClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique categories and tags
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.tags) {
        p.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [posts]);

  // Filter posts based on active filters
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Must be published or default
      if (post.status && post.status !== 'published') return false;

      // Category match
      if (selectedCategory !== 'all' && post.category !== selectedCategory) {
        return false;
      }

      // Tag match
      if (selectedTag && (!post.tags || !post.tags.includes(selectedTag))) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesSummary = post.summary.toLowerCase().includes(q);
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesTag = post.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSummary && !matchesContent && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [posts, selectedCategory, selectedTag, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Controls Bar: Search & Categories */}
      <div className="bg-white border border-concreto rounded-[6px] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-aco-medio" />
            <SuggestInput
              type="blog"
              aria-label="Buscar artigos do blog"
              value={searchTerm}
              onValueChange={setSearchTerm}
              onSuggestionSelect={(s) => router.push(`/blog/${s.slug}`)}
              placeholder="Buscar por palavras-chave, equipamentos ou normas..."
              className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-concreto rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-chapa"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aco-medio hover:text-aco-medio"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-concreto">
          <span className="text-xs font-bold text-aco-medio mr-1">Categorias:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedTag(null);
            }}
            className={` px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors ${
              selectedCategory === 'all' && !selectedTag
                ? 'bg-aco text-white shadow-xs'
                : 'bg-concreto text-aco-medio hover:bg-[#D3D6D1]'
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              className={` px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-colors ${
                selectedCategory === cat && !selectedTag
                  ? 'bg-laranja text-aco shadow-xs'
                  : 'bg-concreto text-aco-medio hover:bg-[#D3D6D1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Active Tag Indicator if filtered by Tag */}
        {selectedTag && (
          <div className="flex items-center gap-2 pt-2 text-xs">
            <span className="text-aco-medio">Filtrando pela tag:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-laranja-texto font-semibold rounded-md">
              <Tag className="w-3 h-3" />
              <span>#{selectedTag}</span>
              <button
                type="button"
                onClick={() => setSelectedTag(null)}
                className="ml-1 hover:text-black"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-aco-medio px-1">
        <span>
          Mostrando <strong className="text-aco">{filteredPosts.length}</strong> {filteredPosts.length === 1 ? 'artigo técnico' : 'artigos técnicos'}
        </span>
        {(searchTerm || selectedCategory !== 'all' || selectedTag) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedTag(null);
            }}
            className="text-laranja-texto hover:underline font-semibold"
          >
            Limpar todos os filtros
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-concreto rounded-[6px] p-8 space-y-3">
          <p className="text-sm font-semibold text-aco-medio">Nenhum artigo encontrado com os critérios selecionados.</p>
          <p className="text-xs text-aco-medio">Tente buscar por termos mais genéricos como &quot;escavadeira&quot;, &quot;NR-12&quot; ou &quot;segurança&quot;.</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedTag(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] mt-2"
          >
            Ver todos os artigos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-concreto rounded-[6px] overflow-hidden hover:border-aco transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-52 bg-concreto overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {post.featured && (
                    <div className="absolute top-3 left-3 bg-laranja text-aco font-bold text-xs px-2.5 py-1 rounded-[4px]">
                      Destaque
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Metadata Bar */}
                  <div className="flex items-center gap-x-3 gap-y-1 text-sm text-aco-medio mb-2 flex-wrap">
                    <span className="font-semibold text-aco">{post.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-aco-medio" />
                      <span>{post.readTime}</span>
                    </span>
                    {typeof post.views === 'number' && (
                      <>
                        <span className="flex items-center gap-1 text-aco-medio" title="visualizações">
                          <Eye className="w-3 h-3" aria-hidden="true" />
                          <span>{post.views}</span>
                        </span>
                      </>
                    )}
                    {post.comments && post.comments.length > 0 && (
                      <>
                        <span className="flex items-center gap-1 text-aco-medio" title="comentários">
                          <MessageSquare className="w-3 h-3" aria-hidden="true" />
                          <span>{post.comments.filter((c) => c.status === 'approved').length}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-aco leading-snug group-hover:underline underline-offset-4 decoration-laranja decoration-2">
                    {post.title}
                  </h2>

                  <p className="text-sm text-aco-medio mt-2.5 line-clamp-3 leading-relaxed">
                    {post.summary}
                  </p>

                  {/* Tags Preview */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-concreto">
                      {post.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-xs font-medium text-aco-medio bg-chapa border border-concreto px-2 py-0.5 rounded-[4px]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 flex items-center justify-between text-xs text-aco-medio border-t border-concreto">
                <span className="flex items-center gap-1.5 font-medium text-aco-medio">
                  <User className="w-3.5 h-3.5 text-aco-medio" />
                  <span className="truncate">
                    {typeof post.author === 'string' ? post.author : post.author?.name || 'Equipe EquiparLoc'}
                  </span>
                </span>
                <span className="text-laranja-texto font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Ler artigo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Global Tags Cloud Footer */}
      {allTags.length > 0 && (
        <div className="bg-white border border-concreto rounded-[6px] p-6 shadow-xs space-y-3">
          <span className="text-xs font-bold text-aco-medio flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-laranja" />
            Nuvem de Tópicos Técnicos
          </span>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTag(tag);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={` text-xs px-2.5 py-1 rounded-md transition-colors ${
                  selectedTag === tag
                    ? 'bg-laranja text-aco font-bold'
                    : 'bg-concreto text-aco-medio hover:bg-[#D3D6D1]'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
