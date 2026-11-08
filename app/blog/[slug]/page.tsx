import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBlogPostBySlug, getAllBlogPosts } from '@/lib/db';
import { User, ChevronRight, ArrowRight, ArrowLeft, MessageSquare } from 'lucide-react';
import { PostInteractiveClient } from '@/components/blog/PostInteractiveClient';
import { ArticleContent } from '@/components/blog/ArticleContent';
import { parseArticle } from '@/lib/article';
import { toPublicPost } from '@/lib/public-data';
import { SITE_URL, absoluteUrl, parsePtBrDate, jsonLdHtml } from '@/lib/site';

// Conteúdo editável pelo CRM: renderiza a cada acesso
export const dynamic = 'force-dynamic';

function getPublishedPost(slug: string) {
  const post = getBlogPostBySlug(slug);
  // Rascunhos e agendados não devem ficar públicos nem indexáveis
  if (!post || (post.status && post.status !== 'published')) return undefined;
  return post;
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPublishedPost(slug);

  if (!post) {
    return { title: 'Artigo Não Encontrado | EquiparLoc', robots: { index: false } };
  }

  const url = `/blog/${post.slug}`;
  const published = parsePtBrDate(post.publishedAt);
  const modified = parsePtBrDate(post.updatedAt) || published;
  const authorName = typeof post.author === 'string' ? post.author : post.author?.name;

  const metaTitle = post.seo?.metaTitle || `${post.title} | Blog EquiparLoc`;
  const metaDesc = post.seo?.metaDescription || post.summary;

  return {
    title: metaTitle,
    description: metaDesc,
    keywords: post.seo?.focusKeyword ? [post.seo.focusKeyword, ...(post.tags || [])] : post.tags,
    alternates: { canonical: post.seo?.canonicalUrl || url },
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title: post.seo?.ogTitle || metaTitle,
      description: post.seo?.ogDescription || metaDesc,
      type: 'article',
      url,
      publishedTime: published?.toISOString(),
      modifiedTime: modified?.toISOString(),
      section: post.category,
      tags: post.tags,
      images: [{ url: post.image, alt: post.imageAlt || post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo?.ogTitle || metaTitle,
      description: post.seo?.ogDescription || metaDesc,
      images: [post.image],
    },
  };
}

export default async function BlogPostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = getPublishedPost(slug);

  if (!post) {
    notFound();
  }

  const allPosts = getAllBlogPosts();
  const otherPosts = allPosts
    .filter((p) => p.id !== post.id && (!p.status || p.status === 'published'))
    .slice(0, 2);

  // Estrutura do artigo (títulos, parágrafos, listas) e sumário
  const blocks = parseArticle(post.content);
  const headings = blocks
    .filter((b): b is Extract<typeof b, { type: 'h2' | 'h3' }> => b.type === 'h2' || b.type === 'h3')
    .map((b) => ({ id: b.id, text: b.text, level: b.type === 'h2' ? 2 : 3 }));

  const pageUrl = absoluteUrl(`/blog/${post.slug}`);
  const published = parsePtBrDate(post.publishedAt);
  const modified = parsePtBrDate(post.updatedAt) || published;

  const authorName = typeof post.author === 'string' ? post.author : post.author?.name || 'Equipe EquiparLoc';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${pageUrl}#artigo`,
        mainEntityOfPage: pageUrl,
        headline: post.title,
        description: post.seo?.metaDescription || post.summary,
        image: absoluteUrl(post.image),
        inLanguage: 'pt-BR',
        author: { '@type': 'Person', name: authorName },
        publisher: { '@id': `${SITE_URL}/#empresa` },
        ...(published ? { datePublished: published.toISOString() } : {}),
        ...(modified ? { dateModified: modified.toISOString() } : {}),
        keywords: post.seo?.focusKeyword || post.tags?.join(', '),
        articleSection: post.category,
        commentCount: post.comments?.filter((c) => c.status === 'approved').length || 0,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
          { '@type': 'ListItem', position: 3, name: post.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="flex items-center gap-1.5 text-xs text-aco-medio">
          <Link href="/" className="hover:text-aco transition-colors">Início</Link>
          <ChevronRight className="w-3.5 h-3.5 text-aco-medio" />
          <Link href="/blog" className="hover:text-aco transition-colors">Blog</Link>
          <ChevronRight className="w-3.5 h-3.5 text-aco-medio" />
          <span className="text-aco font-medium truncate max-w-xs sm:max-w-md">{post.title}</span>
        </nav>

        {/* Article Header */}
        <header className="space-y-4">
          <p className="text-sm text-aco-medio">
            <span className="font-semibold text-aco">{post.category}</span>
            {', '}
            {published ? <time dateTime={published.toISOString().slice(0, 10)}>{post.publishedAt}</time> : <span>{post.publishedAt}</span>}
            {', '}
            {post.readTime}
          </p>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.98] text-balance">
            {post.title}
          </h1>

          <p className="flex items-center gap-2 text-sm text-aco-medio pt-4 border-t border-concreto">
            <User className="w-4 h-4 text-aco" aria-hidden="true" />
            <span>Por <strong className="text-aco">{authorName}</strong></span>
          </p>
        </header>

        {/* Featured Image */}
        <div className="relative w-full h-[320px] sm:h-[440px] rounded-[6px] overflow-hidden border border-concreto">
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            priority
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Client Interactive Area (Views Counter, Social Share, Table of Contents, Comments) */}
        <PostInteractiveClient post={toPublicPost(post)} headings={headings} shareUrl={pageUrl} />

        {/* Corpo do artigo */}
        <article>
          <ArticleContent blocks={blocks} />
        </article>

        {/* Post CTA Box */}
        <div className="placa mt-12 px-8 py-9 bg-aco text-white flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6" style={{ ['--rebite' as string]: '#56626C' }}>
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white leading-[0.95]">
              Precisa escolher a máquina certa?
            </h2>
            <p className="text-sm text-[#C6CDD3] max-w-md">
              Nossa equipe técnica indica o modelo para o seu canteiro e envia a proposta.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/orcamento"
              className="btn-acao px-5 py-3 text-sm whitespace-nowrap"
            >
              <span>Pedir orçamento</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <a
              href={`https://wa.me/5531991970322?text=${encodeURIComponent(
                `Olá EquiparLoc! Li o artigo técnico "${post.title}" no portal e gostaria de tirar dúvidas sobre os equipamentos.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-[4px] transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Related Posts */}
        {otherPosts.length > 0 && (
          <div className="pt-8 border-t border-concreto space-y-4">
            <h2 className="text-2xl font-extrabold text-aco">Leia também</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherPosts.map((op) => (
                <Link
                  key={op.id}
                  href={`/blog/${op.slug}`}
                  className="group p-4 bg-chapa border border-concreto rounded-[6px] hover:border-aco transition-colors flex gap-4 items-center"
                >
                  <div className="relative w-20 h-20 rounded-[4px] overflow-hidden shrink-0 bg-concreto">
                    <Image
                      src={op.image}
                      alt={op.imageAlt || op.title}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-aco-medio block">
                      {op.category}
                    </span>
                    <h3 className="text-base font-bold text-aco line-clamp-2 group-hover:underline underline-offset-4 decoration-laranja decoration-2">
                      {op.title}
                    </h3>
                    <span className="text-[11px] text-aco-medio block">{op.publishedAt}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="pt-6 border-t border-concreto flex items-center justify-between">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-semibold text-aco-medio hover:text-laranja-texto transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para todos os artigos técnicos</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
