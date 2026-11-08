'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BlogPost, BlogComment, PostStatus } from '@/lib/types';
import { analyzePostSeo, autoFixPostSeo, generateCleanSlug } from '@/lib/seo-optimizer';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  MessageSquare,
  Tag,
  Folder,
  Send,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Check,
  X,
  Globe,
  Share2,
  RotateCcw,
} from 'lucide-react';

interface BlogManagerProps {
  posts: BlogPost[];
  onPostsUpdate: (updated: BlogPost[]) => void;
  showToast: (msg: string) => void;
}

export function BlogManager({ posts, onPostsUpdate, showToast }: BlogManagerProps) {
  const [subTab, setSubTab] = useState<'posts' | 'editor' | 'comments' | 'categories'>('posts');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeCommentFilter, setActiveCommentFilter] = useState<'all' | 'pending' | 'approved' | 'spam'>('pending');
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAiSeo, setGeneratingAiSeo] = useState(false);

  // Available authors
  const authorsList = [
    { name: 'Eng. Maurício Santos', role: 'Especialista em Frotas e Engenharia Mecânica (CREA)' },
    { name: 'Rodrigo Lima', role: 'Técnico em Segurança do Trabalho e Instrutor Operacional' },
    { name: 'Equipe Financeira EquiparLoc', role: 'Consultores de Gestão de Ativos e Planejamento de Custos' },
    { name: 'Diretoria de Operações', role: 'Gestão Estratégica e Logística Pesada' },
  ];

  // Distinct categories from existing posts
  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  // All comments aggregated
  const allComments = useMemo(() => {
    const list: { postTitle: string; postSlug: string; postId: string; comment: BlogComment }[] = [];
    posts.forEach((p) => {
      if (p.comments) {
        p.comments.forEach((c) => {
          list.push({
            postTitle: p.title,
            postSlug: p.slug,
            postId: p.id,
            comment: c,
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime());
  }, [posts]);

  const pendingCommentsCount = useMemo(() => {
    return allComments.filter((c) => c.comment.status === 'pending').length;
  }, [allComments]);

  // Open editor for new post
  const handleOpenNewPost = () => {
    const initialTitle = 'Novo Artigo Técnico de Engenharia';
    const initialSlug = generateCleanSlug(initialTitle);
    const initialContent = `## Introdução e Contexto Operacional\n\nDescreva os principais desafios técnicos e operacionais enfrentados no canteiro de obras.\n\n## Critérios Técnicos de Escolha\n\n- Especificações de potência e rendimento\n- Consumo e horímetro de operação\n- Requisitos de conformidade NR-12 e NR-18\n\nConsulte nosso catálogo completo para maiores informações.`;

    const newPost: BlogPost = {
      id: `post-${Date.now()}`,
      slug: initialSlug,
      title: initialTitle,
      status: 'draft',
      category: 'Engenharia & Planejamento',
      tags: ['Máquinas Pesadas', 'Canteiro de Obras'],
      readTime: '3 min de leitura',
      viewsCount: 0,
      publishedAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      author: authorsList[0],
      summary: 'Resumo técnico introdutório para orientar os leitores.',
      content: initialContent,
      image: '/images/cat_escavadeira_1793461101073.jpg',
      imageAlt: `${initialTitle} - EquiparLoc`,
      seo: analyzePostSeo({
        title: initialTitle,
        slug: initialSlug,
        content: initialContent,
        summary: 'Resumo técnico introdutório.',
        focusKeyword: 'máquinas pesadas terraplenagem',
        metaTitle: `${initialTitle} | EquiparLoc`,
        metaDescription: 'Guia técnico e operacional para obras civis e industriais. EquiparLoc.',
        imageAlt: `${initialTitle} - EquiparLoc`,
      }),
      comments: [],
    };

    setEditingPost(newPost);
    setSubTab('editor');
  };

  // Open editor for existing post
  const handleEditPost = (post: BlogPost) => {
    let seoData = post.seo;
    if (!seoData) {
      seoData = analyzePostSeo({
        title: post.title,
        slug: post.slug,
        content: post.content,
        summary: post.summary,
        focusKeyword: '',
        metaTitle: post.title,
        metaDescription: post.summary,
        imageAlt: post.imageAlt || post.title,
      });
    }

    setEditingPost({ ...post, seo: seoData });
    setSubTab('editor');
  };

  // 1-Click Automatic SEO Fixer
  const handleApplyAutoSeoFix = () => {
    if (!editingPost) return;
    const optimized = autoFixPostSeo(editingPost);
    setEditingPost(optimized);
    showToast('✨ Correções automáticas de SEO aplicadas! Título, meta descrição, ALT e cabeçalhos otimizados.');
  };

  // Live SEO recalculation on form changes
  const updateEditingPost = (updates: Partial<BlogPost>) => {
    if (!editingPost) return;
    const updated = { ...editingPost, ...updates };

    // Recalculate word count and reading time
    const wordCount = (updated.content || '').trim().split(/\s+/).filter(Boolean).length;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min de leitura`;

    // Recalculate SEO analysis
    const seoAnalysis = analyzePostSeo({
      title: updated.title,
      slug: updated.slug,
      content: updated.content,
      summary: updated.summary,
      focusKeyword: updated.seo?.focusKeyword || '',
      metaTitle: updated.seo?.metaTitle || `${updated.title.slice(0, 50)} | EquiparLoc`,
      metaDescription: updated.seo?.metaDescription || updated.summary,
      imageAlt: updated.imageAlt || updated.title,
    });

    setEditingPost({
      ...updated,
      readTime,
      seo: seoAnalysis,
    });
  };

  // Add / Remove Tag
  const handleAddTag = () => {
    if (!newTagInput.trim() || !editingPost) return;
    const tag = newTagInput.trim();
    if (!editingPost.tags.includes(tag)) {
      updateEditingPost({ tags: [...editingPost.tags, tag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!editingPost) return;
    updateEditingPost({ tags: editingPost.tags.filter((t) => t !== tagToRemove) });
  };

  // Add New Category
  const handleAddNewCategory = () => {
    if (!newCategoryInput.trim() || !editingPost) return;
    updateEditingPost({ category: newCategoryInput.trim() });
    setNewCategoryInput('');
  };

  // Formatting helpers for content editor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('post-content-textarea') as HTMLTextAreaElement;
    if (!textarea || !editingPost) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingPost.content;
    const selected = text.substring(start, end) || 'texto';

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = text.substring(0, start) + replacement + text.substring(end);

    updateEditingPost({ content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // AI SEO generation via Gemini API
  const handleGenerateGeminiSeo = async () => {
    if (!editingPost || !editingPost.title.trim()) {
      alert('Por favor, informe ao menos o título do artigo para a IA analisar.');
      return;
    }
    setGeneratingAiSeo(true);
    try {
      const res = await fetch('/api/blog/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content,
          summary: editingPost.summary,
          category: editingPost.category,
          image: editingPost.image,
          imageAlt: editingPost.imageAlt,
          existingTags: editingPost.tags,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const mergedTags = Array.from(new Set([...editingPost.tags, ...(data.suggestedTags || [])]));
        updateEditingPost({
          imageAlt: data.imageAlt || editingPost.imageAlt,
          tags: mergedTags,
          summary: editingPost.summary || data.summary,
          seo: {
            ...(editingPost.seo as any),
            focusKeyword: data.focusKeyword || editingPost.seo?.focusKeyword,
            metaTitle: data.metaTitle || editingPost.seo?.metaTitle,
            metaDescription: data.metaDescription || editingPost.seo?.metaDescription,
          },
        });
        showToast('✨ Metadados SEO, texto ALT e tags gerados com sucesso via Gemini!');
      } else {
        showToast('Não foi possível gerar metadados no momento.');
      }
    } catch (e) {
      console.error(e);
      showToast('Falha na conexão ao gerar com IA.');
    } finally {
      setGeneratingAiSeo(false);
    }
  };

  // Save post to server (supports saving draft with automatic Gemini SEO generation)
  const handleSavePost = async (forcedStatus?: PostStatus) => {
    if (!editingPost) return;
    if (!editingPost.title.trim()) {
      alert('O título do artigo é obrigatório');
      return;
    }
    const targetStatus = forcedStatus || editingPost.status;
    const isDraft = targetStatus === 'draft';
    setSaving(true);
    try {
      const isNew = !posts.some((p) => p.id === editingPost.id);
      const url = isNew ? '/api/blog' : `/api/blog/${editingPost.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const postPayload = {
        ...editingPost,
        status: targetStatus,
        autoGenerateWithGemini: isDraft, // Automatically generate SEO metadata for drafts
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });

      if (res.ok) {
        const saved: BlogPost = await res.json();
        if (isNew) {
          onPostsUpdate([saved, ...posts]);
        } else {
          onPostsUpdate(posts.map((p) => (p.id === saved.id ? saved : p)));
        }
        setEditingPost(saved);
        if (isDraft) {
          showToast('✨ Rascunho salvo! Meta-título, descrição SEO, texto ALT e tags gerados automaticamente com IA.');
        } else {
          showToast('Artigo salvo e publicado com sucesso!');
        }
        setSubTab('posts');
      } else {
        alert('Erro ao salvar artigo.');
      }
    } catch (e) {
      console.error(e);
      alert('Falha na conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // Delete post
  const handleDeletePost = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este artigo?')) return;
    try {
      const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onPostsUpdate(posts.filter((p) => p.id !== id));
        showToast('Artigo excluído do sistema.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Moderate comment
  const handleModerateComment = async (postId: string, commentId: string, status: 'approved' | 'pending' | 'spam', reply?: string) => {
    try {
      const res = await fetch(`/api/blog/${postId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, status, reply }),
      });
      if (res.ok) {
        // Refresh local state
        const updatedPosts = posts.map((p) => {
          if (p.id === postId && p.comments) {
            return {
              ...p,
              comments: p.comments.map((c) => (c.id === commentId ? { ...c, status, reply } : c)),
            };
          }
          return p;
        });
        onPostsUpdate(updatedPosts);
        setActiveReplyCommentId(null);
        setReplyText('');
        showToast(`Comentário marcado como ${status === 'approved' ? 'Aprovado' : status === 'spam' ? 'Spam' : 'Pendente'}!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Excluir este comentário permanentemente?')) return;
    try {
      const res = await fetch(`/api/blog/${postId}/comments?commentId=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedPosts = posts.map((p) => {
          if (p.id === postId && p.comments) {
            return { ...p, comments: p.comments.filter((c) => c.id !== commentId) };
          }
          return p;
        });
        onPostsUpdate(updatedPosts);
        showToast('Comentário removido.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered posts in table
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchCat = p.category.toLowerCase().includes(q);
        const matchTags = p.tags && p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchCat && !matchTags) return false;
      }
      return true;
    });
  }, [posts, statusFilter, categoryFilter, searchQuery]);

  // SEO Score Color Helper
  const getSeoBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3" />
          <span>{score}/100 Ótimo</span>
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          <span>{score}/100 Médio</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <span>{score}/100 A melhorar</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('posts')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              subTab === 'posts' ? 'bg-[#101820] text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-[#FF6500]" />
            <span>Todos os Artigos ({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewPost}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              subTab === 'editor' && editingPost && !posts.some((p) => p.id === editingPost.id)
                ? 'bg-[#101820] text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 text-[#FF6500]" />
            <span>Adicionar Novo</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('comments')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
              subTab === 'comments' ? 'bg-[#101820] text-white' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#FF6500]" />
            <span>Moderação de Comentários</span>
            {pendingCommentsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#FF6500] text-white font-bold">
                {pendingCommentsCount}
              </span>
            )}
          </button>
        </div>

        {subTab === 'posts' && (
          <button
            type="button"
            onClick={handleOpenNewPost}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Artigo</span>
          </button>
        )}
      </div>

      {/* VIEW 1: LISTA DE ARTIGOS */}
      {subTab === 'posts' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artigos por título, categoria ou tags..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="all">Todos os Status</option>
                <option value="published">Publicados</option>
                <option value="draft">Rascunhos</option>
                <option value="scheduled">Agendados</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="all">Todas as Categorias</option>
                {existingCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Título do Artigo</th>
                  <th className="p-3">Autor</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Tags</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">SEO Score</th>
                  <th className="p-3 text-center">Visitas</th>
                  <th className="p-3 text-center">Comentários</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block line-clamp-1">{post.title}</span>
                      <span className="text-slate-400 text-[11px] font-mono">/blog/{post.slug}</span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {typeof post.author === 'object' ? post.author.name : post.author}
                    </td>
                    <td className="p-3 text-slate-600">{post.category}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {post.tags?.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {post.status === 'published' ? (
                        <span className="text-emerald-700 font-semibold">Publicado</span>
                      ) : post.status === 'draft' ? (
                        <span className="text-slate-400 font-semibold">Rascunho</span>
                      ) : (
                        <span className="text-blue-600 font-semibold">Agendado</span>
                      )}
                    </td>
                    <td className="p-3">{getSeoBadge(post.seo?.score ?? 85)}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{post.viewsCount || 0}</td>
                    <td className="p-3 text-center font-mono text-slate-700">{post.comments?.length || 0}</td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-1.5 text-slate-400 hover:text-slate-800 inline-block"
                        title="Ver no site público"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleEditPost(post)}
                        className="p-1.5 text-slate-600 hover:text-[#FF6500] inline-block"
                        title="Editar artigo e SEO"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 inline-block"
                        title="Excluir artigo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: EDITOR COMPLETO DE ARTIGO COM SEO AUTOMÁTICO */}
      {subTab === 'editor' && editingPost && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSubTab('posts')}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ← Voltar aos artigos
              </button>
              <span className="text-slate-300">|</span>
              <h2 className="text-sm font-bold text-slate-900">
                {posts.some((p) => p.id === editingPost.id) ? 'Editar Artigo' : 'Criar Novo Artigo'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Highlighted Gemini AI SEO button */}
              <button
                type="button"
                onClick={handleGenerateGeminiSeo}
                disabled={generatingAiSeo || !editingPost.title.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg transition-all shadow-xs disabled:opacity-50"
                title="Gera meta-título, descrição SEO, texto ALT e tags sugeridas com a API do Gemini"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingAiSeo ? 'animate-spin' : ''}`} />
                <span>{generatingAiSeo ? 'Gerando com IA...' : 'Gerar SEO com Gemini'}</span>
              </button>

              {/* 1-Click heuristic SEO auto-fix */}
              <button
                type="button"
                onClick={handleApplyAutoSeoFix}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                title="Aplica correções rápidas de formatação e cabeçalhos"
              >
                <span>Correções Rápidas</span>
              </button>

              {/* Save Draft */}
              <button
                type="button"
                onClick={() => handleSavePost('draft')}
                disabled={saving || generatingAiSeo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
                title="Salva como rascunho gerando automaticamente meta-título, descrição SEO, ALT e tags com IA"
              >
                <span>Salvar Rascunho (com IA)</span>
              </button>

              {/* Publish */}
              <button
                type="button"
                onClick={() => handleSavePost('published')}
                disabled={saving || generatingAiSeo}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-[#101820] hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#FF6500]" />
                <span>{saving ? 'Gravando...' : 'Publicar Artigo'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Content Column (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* Title & Slug */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <label className="font-bold text-slate-800 uppercase tracking-wider">
                      Título do Artigo
                    </label>
                    <span className={editingPost.title.length > 60 ? 'text-amber-600 font-mono' : 'text-slate-400 font-mono'}>
                      {editingPost.title.length}/60 caracteres recomendados
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editingPost.title}
                    onChange={(e) => updateEditingPost({ title: e.target.value })}
                    placeholder="Ex: Como dimensionar a escavadeira hidráulica correta..."
                    className="w-full px-3.5 py-2.5 text-sm font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>

                {/* Slug / Permalink */}
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-400 font-mono">/blog/</span>
                  <input
                    type="text"
                    value={editingPost.slug}
                    onChange={(e) => updateEditingPost({ slug: generateCleanSlug(e.target.value) })}
                    className="flex-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => updateEditingPost({ slug: generateCleanSlug(editingPost.title) })}
                    className="text-[11px] text-[#FF6500] hover:underline whitespace-nowrap"
                  >
                    Gerar da Título
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar & Content Area */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  {/* Toolbar buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting('**', '**')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
                      title="Negrito"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('*', '*')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
                      title="Itálico"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => insertFormatting('## ')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded flex items-center gap-0.5 text-xs font-bold"
                      title="Título H2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('### ')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded flex items-center gap-0.5 text-xs font-bold"
                      title="Título H3"
                    >
                      <Heading3 className="w-4 h-4" />
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => insertFormatting('- ')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
                      title="Lista de Marcadores"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('1. ')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
                      title="Lista Numerada"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('> ')}
                      className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
                      title="Citação em Destaque"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => insertFormatting('[Veja os equipamentos para locação da EquiparLoc](/locacao)')}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded"
                      title="Inserir link interno do Catálogo"
                    >
                      + Link Catálogo
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewActive(!isPreviewActive)}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                        isPreviewActive ? 'bg-[#FF6500] text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {isPreviewActive ? 'Modo Editor' : 'Pré-visualizar Conteúdo'}
                    </button>
                  </div>
                </div>

                {/* Editor or Preview */}
                {isPreviewActive ? (
                  <div className="p-6 prose prose-slate max-w-none text-xs sm:text-sm min-h-[350px]">
                    {editingPost.content.split('\n\n').map((block, i) => {
                      if (block.startsWith('## ')) {
                        return <h2 key={i} className="text-base font-bold text-slate-900 mt-4 mb-2">{block.replace('## ', '')}</h2>;
                      }
                      if (block.startsWith('### ')) {
                        return <h3 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{block.replace('### ', '')}</h3>;
                      }
                      return <p key={i} className="text-slate-700 mb-2 leading-relaxed">{block}</p>;
                    })}
                  </div>
                ) : (
                  <textarea
                    id="post-content-textarea"
                    rows={14}
                    value={editingPost.content}
                    onChange={(e) => updateEditingPost({ content: e.target.value })}
                    placeholder="Escreva seu artigo técnico utilizando títulos H2 e H3 para hierarquia estruturada..."
                    className="w-full p-4 text-xs sm:text-sm font-sans border-0 focus:outline-none resize-y min-h-[350px] leading-relaxed text-slate-900"
                  />
                )}

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{editingPost.content.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                  <span>Tempo de leitura estimado: {editingPost.readTime}</span>
                </div>
              </div>

              {/* Resumo / Excerpt */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Resumo / Excerto da Postagem
                </label>
                <textarea
                  rows={2}
                  value={editingPost.summary}
                  onChange={(e) => updateEditingPost({ summary: e.target.value })}
                  placeholder="Resumo exibido no feed do blog e nos cards de destaque..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                />
              </div>

              {/* SEÇÃO PRINCIPAL: PAINEL DE SEO AVANÇADO E CORREÇÃO AUTOMÁTICA */}
              <div className="bg-white border-2 border-orange-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 bg-[#101820] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF6500]" />
                    <h3 className="text-sm font-bold">Painel de Otimização & Correções de SEO</h3>
                  </div>
                  {getSeoBadge(editingPost.seo?.score ?? 85)}
                </div>

                <div className="p-5 space-y-5">
                  {/* Focus Keyword & 1-Click Fix */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-orange-50/60 border border-orange-100 rounded-lg">
                    <div className="w-full sm:w-auto flex-1">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Palavra-chave Foco para Ranqueamento no Google:
                      </label>
                      <input
                        type="text"
                        value={editingPost.seo?.focusKeyword || ''}
                        onChange={(e) =>
                          updateEditingPost({
                            seo: { ...(editingPost.seo as any), focusKeyword: e.target.value },
                          })
                        }
                        placeholder="Ex: escavadeira hidráulica terraplenagem"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-900"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGenerateGeminiSeo}
                        disabled={generatingAiSeo || !editingPost.title.trim()}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg transition-all shadow-xs disabled:opacity-50 shrink-0"
                        title="Gera meta-título, descrição, ALT e tags com a API do Gemini"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${generatingAiSeo ? 'animate-spin' : ''}`} />
                        <span>{generatingAiSeo ? 'Gerando com Gemini...' : 'Gerar com Gemini'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApplyAutoSeoFix}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs shrink-0"
                      >
                        <span>Ajuste Heurístico</span>
                      </button>
                    </div>
                  </div>

                  {/* Google Search Snippet Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Pré-visualização do Google (Snippet nos Resultados de Busca)
                    </span>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">equiparloc.com.br</span>
                        <span>› blog › {editingPost.slug}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                        {editingPost.seo?.metaTitle || `${editingPost.title} | EquiparLoc`}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {editingPost.seo?.metaDescription || editingPost.summary}
                      </p>
                    </div>
                  </div>

                  {/* Meta Title & Meta Description Editors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <label className="font-bold text-slate-700">Meta Título (SEO Title)</label>
                        <span className="text-slate-400 font-mono">
                          {(editingPost.seo?.metaTitle || '').length}/60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={editingPost.seo?.metaTitle || ''}
                        onChange={(e) =>
                          updateEditingPost({
                            seo: { ...(editingPost.seo as any), metaTitle: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <label className="font-bold text-slate-700">Meta Descrição (Snippet)</label>
                        <span className="text-slate-400 font-mono">
                          {(editingPost.seo?.metaDescription || '').length}/160 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={editingPost.seo?.metaDescription || ''}
                        onChange={(e) =>
                          updateEditingPost({
                            seo: { ...(editingPost.seo as any), metaDescription: e.target.value },
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* SEO Diagnostic Checklist */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Checklist Diagnóstico de SEO
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {editingPost.seo?.checklist.keywordInTitle ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={editingPost.seo?.checklist.keywordInTitle ? 'text-slate-700' : 'text-slate-400'}>
                          Palavra-chave presente no Título
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingPost.seo?.checklist.keywordInMetaDesc ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={editingPost.seo?.checklist.keywordInMetaDesc ? 'text-slate-700' : 'text-slate-400'}>
                          Palavra-chave na Meta Descrição
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingPost.seo?.checklist.keywordInFirstParagraph ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={editingPost.seo?.checklist.keywordInFirstParagraph ? 'text-slate-700' : 'text-slate-400'}>
                          Palavra-chave no 1º parágrafo
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingPost.seo?.checklist.subheadingsPresent ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={editingPost.seo?.checklist.subheadingsPresent ? 'text-slate-700' : 'text-slate-400'}>
                          Subtítulos H2/H3 estruturados
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingPost.seo?.checklist.imageAltContainsKeyword ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={editingPost.seo?.checklist.imageAltContainsKeyword ? 'text-slate-700' : 'text-slate-400'}>
                          Texto alternativo (ALT) na imagem
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {editingPost.seo?.checklist.internalLinksPresent ? (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className={editingPost.seo?.checklist.internalLinksPresent ? 'text-slate-700' : 'text-slate-400'}>
                          Links internos para o Catálogo / Cotação
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Column (4 cols) */}
            <div className="lg:col-span-4 space-y-5">
              {/* Box 1: Publicação */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Status & Publicação
                </h3>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status do Artigo</label>
                  <select
                    value={editingPost.status}
                    onChange={(e) => updateEditingPost({ status: e.target.value as PostStatus })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="published">Publicado Imediatamente</option>
                    <option value="draft">Salvar como Rascunho</option>
                    <option value="scheduled">Agendado para Publicação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Data de Publicação</label>
                  <input
                    type="text"
                    value={editingPost.publishedAt}
                    onChange={(e) => updateEditingPost({ publishedAt: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSavePost('draft')}
                    disabled={saving || generatingAiSeo}
                    className="w-full py-2 px-3 text-xs font-bold text-slate-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    title="Gera meta-título, descrição, ALT e tags com Gemini ao salvar o rascunho"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6500]" />
                    <span>Salvar Rascunho (Gera com IA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSavePost('published')}
                    disabled={saving || generatingAiSeo}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{saving ? 'Gravando no Sistema...' : 'Publicar Artigo'}</span>
                  </button>
                </div>
              </div>

              {/* Box 2: Categorias */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Categoria Principal</span>
                  <Folder className="w-3.5 h-3.5 text-[#FF6500]" />
                </h3>

                <select
                  value={editingPost.category}
                  onChange={(e) => updateEditingPost({ category: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {existingCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Engenharia & Planejamento">Engenharia & Planejamento</option>
                  <option value="Segurança Operacional">Segurança Operacional</option>
                  <option value="Gestão Financeira">Gestão Financeira</option>
                  <option value="Manutenção e Tecnologia">Manutenção e Tecnologia</option>
                </select>

                <div className="pt-1 flex gap-1">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    placeholder="Nova categoria..."
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    + Criar
                  </button>
                </div>
              </div>

              {/* Box 3: Tags / Palavras-chave */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Tags do Artigo</span>
                  <button
                    type="button"
                    onClick={handleGenerateGeminiSeo}
                    disabled={generatingAiSeo || !editingPost.title.trim()}
                    className="text-[10px] text-[#FF6500] hover:underline flex items-center gap-1 font-semibold"
                    title="Gera tags sugeridas e metadados usando IA Gemini"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Sugerir com IA</span>
                  </button>
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {editingPost.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-1 pt-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Adicionar tag e pressionar Enter..."
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Box 4: Imagem Destacada e Texto ALT */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Imagem Destacada
                </h3>

                <div className="relative w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <Image
                    src={editingPost.image}
                    alt={editingPost.imageAlt || editingPost.title}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Selecionar Imagem</label>
                  <select
                    value={editingPost.image}
                    onChange={(e) => updateEditingPost({ image: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="/images/cat_escavadeira_1793461101073.jpg">Escavadeira Hidráulica 21t</option>
                    <option value="/images/cat_plataforma_1793461101024.jpg">Plataforma Articulada 16m</option>
                    <option value="/images/hero_heavy_machinery_1793461100728.jpg">Canteiro Pesado de Obras</option>
                    <option value="/images/cat_retroescavadeira_1793461100792.jpg">Retroescavadeira 4x4</option>
                    <option value="/images/cat_gerador_1793461141901.jpg">Gerador Silenciado 150 kVA</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <label className="font-semibold text-slate-600">
                      Texto Alternativo (ALT) para Imagens
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateGeminiSeo}
                      disabled={generatingAiSeo || !editingPost.title.trim()}
                      className="text-[10px] text-[#FF6500] hover:underline flex items-center gap-1 font-semibold"
                      title="Gera texto alternativo técnico com IA"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Gerar ALT com IA</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editingPost.imageAlt || ''}
                    onChange={(e) => updateEditingPost({ imageAlt: e.target.value })}
                    placeholder="Descrição para acessibilidade e SEO de imagens..."
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Box 5: Autor */}
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Autor do Artigo
                </h3>

                <select
                  value={typeof editingPost.author === 'object' ? editingPost.author.name : editingPost.author}
                  onChange={(e) => {
                    const match = authorsList.find((a) => a.name === e.target.value);
                    if (match) updateEditingPost({ author: match });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {authorsList.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MODERAÇÃO DE COMENTÁRIOS */}
      {subTab === 'comments' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Moderação de Comentários dos Leitores</h2>
              <p className="text-xs text-slate-500">Aprove comentários legítimos, responda oficialmente como EquiparLoc ou descarte spams.</p>
            </div>

            <div className="flex gap-1 text-xs">
              {(['all', 'pending', 'approved', 'spam'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveCommentFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize ${
                    activeCommentFilter === filter
                      ? 'bg-[#101820] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' ? 'Todos' : filter === 'pending' ? 'Pendentes' : filter === 'approved' ? 'Aprovados' : 'Spam'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {allComments
              .filter((item) => activeCommentFilter === 'all' || item.comment.status === activeCommentFilter)
              .map(({ postTitle, postId, comment }) => (
                <div key={comment.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <strong className="text-xs font-bold text-slate-900">{comment.authorName}</strong>
                      <span className="text-slate-400 text-xs ml-2">({comment.authorEmail})</span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        No artigo: <strong className="text-slate-700">{postTitle}</strong> · {new Date(comment.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {comment.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aprovado
                        </span>
                      )}
                      {comment.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pendente de Moderação
                        </span>
                      )}
                      {comment.status === 'spam' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Spam
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {comment.content}
                  </p>

                  {/* Existing Reply */}
                  {comment.reply && (
                    <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-lg text-xs space-y-1">
                      <span className="text-[11px] font-bold text-[#FF6500]">
                        Resposta oficial ({comment.replyAuthor || 'EquiparLoc'}):
                      </span>
                      <p className="text-slate-800">{comment.reply}</p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      {comment.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleModerateComment(postId, comment.id, 'approved')}
                          className="px-3 py-1 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                        >
                          Aprovar
                        </button>
                      )}
                      {comment.status !== 'spam' && (
                        <button
                          type="button"
                          onClick={() => handleModerateComment(postId, comment.id, 'spam')}
                          className="px-3 py-1 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                        >
                          Marcar Spam
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveReplyCommentId(comment.id);
                          setReplyText(comment.reply || '');
                        }}
                        className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                      >
                        {comment.reply ? 'Editar Resposta' : 'Responder ao Leitor'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(postId, comment.id)}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      Excluir
                    </button>
                  </div>

                  {/* Reply Input Box */}
                  {activeReplyCommentId === comment.id && (
                    <div className="pt-2 flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva a resposta oficial da equipe técnica..."
                        className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                      />
                      <button
                        type="button"
                        onClick={() => handleModerateComment(postId, comment.id, 'approved', replyText)}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg"
                      >
                        Enviar Resposta
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReplyCommentId(null)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}

            {allComments.length === 0 && (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-400 text-xs">
                Nenhum comentário registrado nos artigos até o momento.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
