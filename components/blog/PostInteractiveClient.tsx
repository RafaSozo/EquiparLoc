'use client';

import { FIELD_LIMITS as L } from '@/lib/form-limits';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BlogPost, BlogComment } from '@/lib/types';
import {
  MessageSquare,
  Share2,
  Copy,
  Check,
  Send,
  User,
  ShieldCheck,
  ListOrdered,
  Tag,
  Eye,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PostInteractiveClientProps {
  post: BlogPost;
  headings: { id: string; text: string; level: number }[];
  /** URL pública do artigo (vinda do servidor, evita diferença entre servidor e navegador) */
  shareUrl: string;
}

export function PostInteractiveClient({ post, headings, shareUrl }: PostInteractiveClientProps) {
  const [copied, setCopied] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [comments, setComments] = useState<BlogComment[]>(post.comments || []);
  const [viewsCount, setViewsCount] = useState<number>(post.views || 0);

  const viewCountedRef = useRef(false);

  // Track article view on client load
  useEffect(() => {
    if (!viewCountedRef.current && post.id) {
      viewCountedRef.current = true;
      fetch(`/api/blog/${post.id}/views`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.views === 'number') {
            setViewsCount(data.views);
          }
        })
        .catch(() => {
          // Silent fallback
        });
    }
  }, [post.id]);

  const currentUrl = shareUrl;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentContent.trim()) {
      setCommentError('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/blog/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: commentName.trim(),
          authorEmail: commentEmail.trim(),
          content: commentContent.trim(),
        }),
      });

      if (res.ok) {
        setCommentSuccess(true);
        setCommentName('');
        setCommentEmail('');
        setCommentContent('');
        setTimeout(() => setCommentSuccess(false), 8000);
      } else {
        const data = await res.json();
        setCommentError(data.error || 'Erro ao registrar comentário.');
      }
    } catch {
      setCommentError('Erro de conexão ao enviar o comentário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedComments = comments.filter((c) => c.status === 'approved');

  return (
    <div className="space-y-10">
      {/* Article Stats & Social Share Bar */}
      <div className="py-4 px-5 bg-chapa border border-concreto rounded-[6px] flex flex-wrap items-center justify-between gap-4">
        {/* Read stats */}
        <div className="flex items-center gap-4 text-xs text-aco-medio">
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="w-4 h-4 text-laranja" />
            <span>{viewsCount} visualizações</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <MessageSquare className="w-4 h-4 text-aco-medio" />
            <span>{approvedComments.length} comentários</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4 text-aco-medio" />
            <span>{post.readTime}</span>
          </span>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-aco-medio flex items-center gap-1 mr-1">
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar:
          </span>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Confira este artigo técnico da EquiparLoc: ${post.title} - ${currentUrl}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-semibold text-aco border border-concreto hover:border-aco rounded-[4px] transition-colors"
          >
            WhatsApp
          </a>

          {/* LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-semibold text-aco border border-concreto hover:border-aco rounded-[4px] transition-colors"
          >
            LinkedIn
          </a>

          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `${post.title} | EquiparLoc`
            )}&url=${encodeURIComponent(currentUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-sm font-semibold text-aco border border-concreto hover:border-aco rounded-[4px] transition-colors"
          >
            X
          </a>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-aco-medio hover:bg-chapa rounded-[4px] transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-aco-medio" />
                <span>Copiar link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Table of Contents (Índice do Artigo) */}
      {headings.length > 0 && (
        <aside className="p-5 bg-chapa border border-concreto rounded-[6px] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-aco">
            <ListOrdered className="w-4 h-4 text-laranja" />
            <span>Índice do Artigo</span>
          </div>
          <ul className="space-y-1.5 text-xs">
            {headings.map((h, i) => (
              <li key={i} className={h.level === 3 ? 'ml-4' : ''}>
                <a
                  href={`#${h.id}`}
                  className="text-aco-medio hover:text-laranja-texto hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <span className="text-aco-medio text-xs" aria-hidden="true">§</span>
                  <span>{h.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* Post Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-4 border-t border-concreto">
          <span className="text-xs font-bold text-aco-medio flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-laranja" />
            Tags:
          </span>
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog`}
              className="text-xs px-2.5 py-1 bg-concreto text-aco-medio hover:bg-orange-50 hover:text-laranja-texto rounded-md transition-colors font-medium"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Author Bio Box */}
      {(() => {
        const authorName = typeof post.author === 'string' ? post.author : post.author?.name || 'Equipe EquiparLoc';
        const authorRole = typeof post.author === 'object' ? post.author?.role : 'Especialista Técnico EquiparLoc';
        return (
          <div className="p-6 bg-chapa border border-concreto rounded-[6px] flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-aco text-white flex items-center justify-center font-bold text-lg shrink-0">
              {authorName.charAt(0)}
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-aco">{authorName}</p>
                <span className="px-2 py-0.5 bg-chapa border border-concreto text-aco font-semibold text-xs rounded-[4px]">
                  {authorRole}
                </span>
              </div>
              <p className="text-aco-medio leading-relaxed">
                Responsável pelo setor de engenharia de aplicação e consultoria técnica de frotas da EquiparLoc, especialista em segurança operacional NR-12 e rendimento em canteiros de grande porte.
              </p>
            </div>
          </div>
        );
      })()}

      {/* Comments Section */}
      <section id="comentarios" className="space-y-6 pt-6 border-t border-concreto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-laranja" />
            <h3 className="text-lg font-bold text-aco">
              Comentários e Discussão Técnica ({approvedComments.length})
            </h3>
          </div>
          <span className="text-xs text-aco-medio">Moderação ativa pela equipe</span>
        </div>

        {/* Existing Approved Comments */}
        <div className="space-y-4">
          {approvedComments.length === 0 ? (
            <div className="p-6 bg-chapa border border-concreto rounded-[6px] text-center text-xs text-aco-medio">
              Seja o primeiro a deixar uma dúvida ou consideração técnica sobre este tema!
            </div>
          ) : (
            approvedComments.map((comment) => (
              <div
                key={comment.id}
                className="p-5 bg-white border border-concreto rounded-[6px] shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-aco-medio flex items-center justify-center font-bold text-xs">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-aco block">{comment.authorName}</span>
                      <span className="text-[11px] text-aco-medio">
                        {comment.date || (comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('pt-BR') : 'Recente')}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-aco-medio leading-relaxed pl-10">
                  {comment.content}
                </p>

                {/* EquiparLoc Official Reply if present */}
                {comment.reply && (
                  <div className="ml-10 p-4 bg-chapa border-l-4 border-laranja rounded-r-[6px] space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-aco">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Resposta da EquiparLoc</span>
                    </div>
                    <p className="text-sm text-aco leading-relaxed">{comment.reply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Submit Comment Form */}
        <div className="bg-chapa border border-concreto rounded-[6px] p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-aco">Deixe seu comentário</h3>
            <p className="text-xs text-aco-medio">
              Seu endereço de e-mail não será publicado. Campos obrigatórios são marcados com *
            </p>
          </div>

          {commentSuccess && (
            <div className="p-3.5 bg-chapa border border-liberado rounded-[6px] text-sm text-liberado flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Obrigado pelo seu comentário! Ele foi enviado para a moderação técnica e será publicado em instantes.
              </span>
            </div>
          )}

          {commentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-xs text-red-700">
              {commentError}
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="comentario-campo-1" className="block text-xs font-semibold text-aco-medio mb-1">
                  Seu Nome *
                </label>
                <input
                      id="comentario-campo-1"
                  type="text"
                  required
                  maxLength={L.name}
                    value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Ex: Carlos Mendes"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-white"
                />
              </div>

              <div>
                <label htmlFor="comentario-campo-2" className="block text-xs font-semibold text-aco-medio mb-1">
                  Seu E-mail (Privado) *
                </label>
                <input
                      id="comentario-campo-2"
                  type="email"
                  required
                  maxLength={L.email}
                    value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="carlos@empresa.com.br"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="comentario-campo-3" className="block text-xs font-semibold text-aco-medio mb-1">
                Comentário ou Dúvida Operacional *
              </label>
              <textarea
                      id="comentario-campo-3"
                required
                rows={3}
                maxLength={L.comment}
                    value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Compartilhe sua experiência de campo ou faça uma pergunta sobre a máquina..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-white resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publicar Comentário</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
