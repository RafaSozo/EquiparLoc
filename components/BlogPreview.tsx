'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/types';
import { ArrowRight, BookOpen } from 'lucide-react';
import { gridColsFor } from '@/lib/grid';

interface BlogPreviewProps {
  posts: BlogPost[];
}

export function BlogPreview({ posts }: BlogPreviewProps) {
  return (
    <section className="py-16 sm:py-24 bg-chapa border-b border-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
              Guias para planejar a obra
            </h2>
            <p className="text-base text-aco-medio mt-3 max-w-xl">
              Como dimensionar máquinas, cumprir as normas e comparar custos, escrito pela nossa equipe técnica.
            </p>
          </div>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco whitespace-nowrap"
          >
            Ver todos os artigos
          </Link>
        </div>

        <div className={`grid ${gridColsFor(Math.min(posts.length, 3))} gap-6`}>
          {posts.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white border border-concreto rounded-[6px] overflow-hidden hover:border-aco transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="relative w-full h-48 bg-slate-200 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.imageAlt || post.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="p-5">
                  {/* Clean unboxed metadata (anti-slop zero-pill rule) */}
                  <p className="text-sm text-aco-medio mb-2">
                    {post.category}, {post.readTime}
                  </p>

                  <h3 className="text-lg font-bold text-aco leading-snug line-clamp-2 group-hover:underline underline-offset-4 decoration-laranja decoration-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-aco-medio mt-2 line-clamp-3 leading-relaxed">
                    {post.summary}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 flex items-center justify-between text-sm text-aco-medio border-t border-concreto">
                <span className="font-medium text-aco">
                  {typeof post.author === 'string' ? post.author : post.author?.name || 'Equipe EquiparLoc'}
                </span>
                <span className="font-semibold text-aco">Ler artigo</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
