'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Equipment, QuoteRequest, BlogPost, CompanySettings, QuoteStatus, CategoryWithCount, ProductLine } from '@/lib/types';
import {
  LayoutDashboard,
  Truck,
  FileSpreadsheet,
  FileText,
  Settings,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Mail,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  X,
  Save,
  Send,
  Lock,
  ExternalLink,
  UserCheck,
  KeyRound,
  Loader2,
  BadgeAlert,
  Tags,
  ImageIcon,
} from 'lucide-react';
import { BlogManager } from '@/components/admin/BlogManager';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { HeroManager } from '@/components/admin/HeroManager';
import { CatalogManager } from '@/components/admin/CatalogManager';

interface AdminDashboardProps {
  /** Login confirmado no servidor. Sem login, nenhum dado da empresa é enviado ao navegador. */
  authenticated: boolean;
  /** Há usuário configurado no .env? (orienta a configuração na tela de login) */
  loginConfigured: boolean;
  initialCategories: CategoryWithCount[];
  /** Linhas de produto (Máquinas pesadas, Ferramentas, Serviços...) */
  initialLines: ProductLine[];
  initialEquipments: Equipment[];
  initialQuotes: QuoteRequest[];
  initialBlog: BlogPost[];
  initialSettings: CompanySettings;
}

export function AdminDashboard({
  authenticated,
  loginConfigured,
  initialCategories,
  initialLines,
  initialEquipments,
  initialQuotes,
  initialBlog,
  initialSettings,
}: AdminDashboardProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // A sessão é validada no servidor (cookie assinado). Nada fica salvo no navegador.
  const isAuthenticated = authenticated;

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const currentUser = {
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    role: (session?.user?.role === 'admin' ? 'admin' : 'operador') as 'admin' | 'operador',
    title: session?.user?.title || '',
  };

  // Active module
  const [activeTab, setActiveTab] = useState<'dashboard' | 'equipamentos' | 'categorias' | 'orcamentos' | 'conteudo' | 'abertura' | 'configuracoes'>('dashboard');

  // Data states
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
  const [lines, setLines] = useState<ProductLine[]>(initialLines);

  // Itens por categoria (ativos + rascunhos) para avisos de exclusão
  const categoryUsage = equipments.reduce<Record<string, number>>((acc, eq) => {
    acc[eq.category] = (acc[eq.category] || 0) + 1;
    return acc;
  }, {});
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(initialBlog);
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);

  // Filters & search
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('todos');
  const [quoteSearch, setQuoteSearch] = useState('');

  // Modals
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    try {
      const result = await signIn('credentials', {
        email: loginEmail.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result && !result.error) {
        setLoginPassword('');
        // Recarrega a página no servidor, que agora envia os dados do painel
        router.refresh();
      } else if (result?.error && result.error !== 'CredentialsSignin') {
        setAuthError(result.error);
      } else {
        setAuthError('E-mail ou senha incorretos.');
      }
    } catch {
      setAuthError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
    } finally {
      router.refresh();
    }
  };

  // Quotes Status updates
  const handleUpdateQuoteStatus = async (quoteId: string, newStatus: QuoteStatus, note?: string) => {
    try {
      const res = await fetch(`/api/orcamentos/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          noteText: note || `Status alterado para ${newStatus.replace('_', ' ')}`,
          author: 'Gestor Comercial',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setQuotes((prev) => prev.map((q) => (q.id === quoteId ? updated : q)));
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote(updated);
        }
        showToast('Status do orçamento atualizado com sucesso!');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status.');
    }
  };

  const handleAddQuoteNote = async () => {
    if (!selectedQuote || !newNoteText.trim()) return;
    try {
      const res = await fetch(`/api/orcamentos/${selectedQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedQuote.status,
          noteText: newNoteText.trim(),
          author: 'Atendente EquiparLoc',
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setQuotes((prev) => prev.map((q) => (q.id === selectedQuote.id ? updated : q)));
        setSelectedQuote(updated);
        setNewNoteText('');
        showToast('Nota adicionada ao histórico de atendimento.');
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== 'admin') {
      showToast('Apenas Administradores Chefes podem alterar dados cadastrais.');
      return;
    }

    try {
      const res = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings((prev) => ({ ...prev, ...updated }));
        showToast('Configurações atualizadas com sucesso!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics calculation
  const totalEquipments = equipments.length;
  const activeEquipments = equipments.filter((e) => e.status === 'active').length;
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter((q) => q.status === 'novo').length;
  const closedQuotes = quotes.filter((q) => q.status === 'concluido').length;
  const conversionRate = totalQuotes > 0 ? ((closedQuotes / totalQuotes) * 100).toFixed(1) : '0.0';

  // Filtered quotes
  const filteredQuotes = quotes.filter((q) => {
    if (quoteStatusFilter !== 'todos' && q.status !== quoteStatusFilter) return false;
    if (quoteSearch.trim()) {
      const term = quoteSearch.toLowerCase();
      const mName = q.customerName.toLowerCase().includes(term);
      const mComp = q.companyName?.toLowerCase().includes(term);
      const mEq = q.equipmentName.toLowerCase().includes(term);
      const mProt = q.protocol.toLowerCase().includes(term);
      if (!mName && !mComp && !mEq && !mProt) return false;
    }
    return true;
  });


  // Status visual helper
  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'novo':
        return <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">Novo</span>;
      case 'em_atendimento':
        return <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">Em Atendimento</span>;
      case 'proposta_enviada':
        return <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">Proposta Enviada</span>;
      case 'concluido':
        return <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">Concluído</span>;
      case 'perdido':
        return <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">Perdido</span>;
      default:
        return <span>{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#101820] flex items-center justify-center p-4">
        <main className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-7 sm:p-9 shadow-2xl">
          <div className="space-y-2 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#FF6500] text-white flex items-center justify-center font-extrabold text-lg shadow-md" aria-hidden="true">
              EQ
            </div>
            <h1 className="text-xl font-bold text-slate-900">Entrar no painel EquiparLoc</h1>
            <p className="text-xs text-slate-500">Acesso restrito à equipe da empresa.</p>
          </div>

          {!loginConfigured && (
            <div role="status" className="mb-4 p-3 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
              Nenhum usuário configurado. Defina ADMIN_EMAIL e ADMIN_PASSWORD nas variáveis de ambiente
              (arquivo .env.local) e reinicie o servidor.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
            {authError && (
              <div role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  autoFocus
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500] text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-senha" className="block text-xs font-semibold text-slate-700 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
                <input
                  id="login-senha"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500] text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 text-sm font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" aria-hidden="true" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              Voltar para o site
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#101820] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#FF6500]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="bg-[#101820] text-white border-b border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo-equiparloc-branca.png"
              alt="EquiparLoc"
              width={467}
              height={89}
              className="h-8 w-auto"
            />
            <span className="font-bold text-sm tracking-tight text-white">CRM</span>
          </Link>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-xs text-slate-400 hidden md:inline">
            Gestão de Frota, Orçamentos & Conteúdo
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* User profile with role badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <div className="w-6 h-6 rounded-full bg-[#FF6500] text-white font-bold text-[10px] flex items-center justify-center">
              {currentUser.name ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'EQ'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-none">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">
                {currentUser.title}
              </span>
            </div>
            <span
              className={`ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                currentUser.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {currentUser.role === 'admin' ? (
                <>
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Admin Chefe</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>Operador Comercial</span>
                </>
              )}
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span>Ver Website</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors cursor-pointer"
            title="Encerrar sessão NextAuth"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-4 space-y-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-[#101820] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#FF6500]" />
            <span>Dashboard & Indicadores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('equipamentos')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'equipamentos'
                ? 'bg-[#101820] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-[#FF6500]" />
              <span>Produtos</span>
            </span>
            <span className="text-[11px] font-mono opacity-70">{equipments.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categorias')}
            className={`w-full flex items-center justify-between pl-7 pr-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'categorias'
                ? 'bg-[#101820] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Tags className="w-4 h-4 text-[#FF6500]" />
              <span>Categorias e subcategorias</span>
            </span>
            <span className="text-[11px] font-mono opacity-70">{categories.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orcamentos')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'orcamentos'
                ? 'bg-[#101820] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-[#FF6500]" />
              <span>Orçamentos CRM</span>
            </span>
            {pendingQuotes > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6500] text-white">
                {pendingQuotes}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conteudo')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'conteudo'
                ? 'bg-[#101820] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-[#FF6500]" />
            <span>Conteúdo & Blog</span>
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('abertura')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'abertura'
                  ? 'bg-[#101820] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#FF6500]" />
              <span>Abertura do site</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('configuracoes')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'configuracoes'
                ? 'bg-[#101820] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-[#FF6500]" />
            <span>Configurações</span>
          </button>
        </aside>

        {/* Tab Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Visão Geral da Operação</h2>
                <p className="text-xs text-slate-500">Métricas em tempo real de frota e funil de conversão de orçamentos.</p>
              </div>

              {/* KPI Cards Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Equipamentos</span>
                  <div className="text-3xl font-mono font-bold text-slate-900 mt-2">{totalEquipments}</div>
                  <span className="text-[11px] text-emerald-600 font-medium block mt-1">{activeEquipments} ativos para locação</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Orçamentos Recebidos</span>
                  <div className="text-3xl font-mono font-bold text-slate-900 mt-2">{totalQuotes}</div>
                  <span className="text-[11px] text-slate-500 block mt-1">Registrados na base</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitações Pendentes</span>
                  <div className="text-3xl font-mono font-bold text-[#FF6500] mt-2">{pendingQuotes}</div>
                  <span className="text-[11px] text-amber-600 font-medium block mt-1">Aguardando atendimento</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taxa de Conversão</span>
                  <div className="text-3xl font-mono font-bold text-emerald-600 mt-2">{conversionRate}%</div>
                  <span className="text-[11px] text-slate-500 block mt-1">{closedQuotes} contratos concluídos</span>
                </div>
              </div>

              {/* Status Funnel & Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Funil de Atendimento Comercial</h3>
                <div className="grid grid-cols-5 gap-3 text-center">
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-[11px] font-semibold text-amber-800 uppercase">Novo</span>
                    <div className="text-xl font-bold font-mono text-amber-900 mt-1">
                      {quotes.filter((q) => q.status === 'novo').length}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-[11px] font-semibold text-blue-800 uppercase">Em Atendimento</span>
                    <div className="text-xl font-bold font-mono text-blue-900 mt-1">
                      {quotes.filter((q) => q.status === 'em_atendimento').length}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-[11px] font-semibold text-purple-800 uppercase">Proposta Enviada</span>
                    <div className="text-xl font-bold font-mono text-purple-900 mt-1">
                      {quotes.filter((q) => q.status === 'proposta_enviada').length}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase">Concluído</span>
                    <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
                      {quotes.filter((q) => q.status === 'concluido').length}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                    <span className="text-[11px] font-semibold text-rose-800 uppercase">Perdido</span>
                    <div className="text-xl font-bold font-mono text-rose-900 mt-1">
                      {quotes.filter((q) => q.status === 'perdido').length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Quotes Quick Action Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Últimos Orçamentos Registrados</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orcamentos')}
                    className="text-xs font-semibold text-[#FF6500] hover:underline"
                  >
                    Ver todos no CRM →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Protocolo</th>
                        <th className="p-3">Cliente / Empresa</th>
                        <th className="p-3">Equipamento</th>
                        <th className="p-3">Data</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotes.slice(0, 5).map((q) => (
                        <tr key={q.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-900">{q.protocol}</td>
                          <td className="p-3">
                            <span className="font-semibold block text-slate-900">{q.customerName}</span>
                            <span className="text-slate-400 text-[11px]">{q.companyName || 'Pessoa Física'}</span>
                          </td>
                          <td className="p-3 font-medium text-slate-800">{q.equipmentName}</td>
                          <td className="p-3 text-slate-500">{new Date(q.createdAt).toLocaleDateString('pt-BR')}</td>
                          <td className="p-3">{getStatusBadge(q.status)}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuote(q);
                                setActiveTab('orcamentos');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                            >
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CATEGORIAS */}
          {activeTab === 'categorias' && (
            <CategoryManager
              categories={categories}
              onChange={setCategories}
              usage={categoryUsage}
              lines={lines}
              onLinesChange={setLines}
              onItemsMoved={(from, to) =>
                setEquipments((list) => list.map((eq) => (eq.category === from ? { ...eq, category: to } : eq)))
              }
              showToast={showToast}
            />
          )}

          {/* TAB 2: EQUIPAMENTOS */}
          {activeTab === 'equipamentos' && (
            <CatalogManager
              equipments={equipments}
              onChange={setEquipments}
              categories={categories}
              onCategoriesChange={setCategories}
              lines={lines}
              isAdmin={currentUser.role === 'admin'}
              showToast={showToast}
              onManageCategories={() => setActiveTab('categorias')}
            />
          )}

          {/* TAB 3: ORÇAMENTOS CRM */}
          {activeTab === 'orcamentos' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">CRM de Orçamentos & Atendimento</h2>
                  <p className="text-xs text-slate-500">Acompanhe leads, histórico de contato e altere o status das negociações.</p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-xs">
                {['todos', 'novo', 'em_atendimento', 'proposta_enviada', 'concluido', 'perdido'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setQuoteStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize whitespace-nowrap ${
                      quoteStatusFilter === st
                        ? 'bg-[#101820] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={quoteSearch}
                    onChange={(e) => setQuoteSearch(e.target.value)}
                    placeholder="Buscar por cliente, empresa, equipamento ou protocolo..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>
              </div>

              {/* Quotes Grid / Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className={`${selectedQuote ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs`}>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Protocolo</th>
                        <th className="p-3">Cliente / Empresa</th>
                        <th className="p-3">Equipamento</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredQuotes.map((q) => (
                        <tr
                          key={q.id}
                          onClick={() => setSelectedQuote(q)}
                          className={`cursor-pointer transition-colors ${
                            selectedQuote?.id === q.id ? 'bg-orange-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-mono font-bold text-slate-900">{q.protocol}</td>
                          <td className="p-3">
                            <span className="font-semibold block text-slate-900">{q.customerName}</span>
                            <span className="text-slate-400 text-[11px]">{q.phone}</span>
                          </td>
                          <td className="p-3 font-medium text-slate-800 max-w-[150px] truncate">{q.equipmentName}</td>
                          <td className="p-3">{getStatusBadge(q.status)}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuote(q);
                              }}
                              className="px-2 py-1 text-xs font-semibold text-[#FF6500] hover:underline"
                            >
                              Abrir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Quote Details & Timeline Drawer */}
                {selectedQuote && (
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Protocolo de Cotação</span>
                        <h3 className="text-base font-bold text-slate-900 font-mono">{selectedQuote.protocol}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedQuote(null)}
                        className="p-1 text-slate-400 hover:text-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Solicitante:</span>
                        <strong className="text-slate-900">{selectedQuote.customerName}</strong> {selectedQuote.companyName && `(${selectedQuote.companyName})`}
                      </div>
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Telefone:</span>
                          <span className="font-mono text-slate-800">{selectedQuote.phone}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">E-mail:</span>
                          <span className="text-slate-800">{selectedQuote.email}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Equipamento Solicitado:</span>
                        <strong className="text-[#FF6500]">{selectedQuote.equipmentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Local da Obra:</span>
                        <span className="text-slate-800">{selectedQuote.siteLocation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Período Previsto:</span>
                        <span className="text-slate-800">{selectedQuote.rentalPeriod}</span>
                      </div>
                      {selectedQuote.message && (
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mt-2">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Mensagem do cliente:</span>
                          <p className="text-slate-700 italic">{selectedQuote.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Changer */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">
                        Alterar Status de Atendimento:
                      </label>
                      <select
                        value={selectedQuote.status}
                        onChange={(e) => handleUpdateQuoteStatus(selectedQuote.id, e.target.value as QuoteStatus)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                      >
                        <option value="novo">Novo</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="proposta_enviada">Proposta Enviada</option>
                        <option value="concluido">Concluído (Contrato Fechado)</option>
                        <option value="perdido">Perdido</option>
                      </select>
                    </div>

                    {/* Quick WhatsApp Direct Link */}
                    <div className="flex gap-2">
                      <a
                        href={`https://wa.me/55${selectedQuote.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Olá ${selectedQuote.customerName}! Aqui é da EquiparLoc a respeito da sua solicitação de orçamento (${selectedQuote.protocol}) para o equipamento ${selectedQuote.equipmentName}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chamar no WhatsApp</span>
                      </a>

                      <a
                        href={`mailto:${selectedQuote.email}?subject=${encodeURIComponent(
                          `EquiparLoc - Proposta de Locação (${selectedQuote.protocol})`
                        )}`}
                        className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Enviar e-mail"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Timeline / Notes History */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Histórico de Atendimento ({selectedQuote.notes?.length || 0})
                      </label>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedQuote.notes?.map((n) => (
                          <div key={n.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700">{n.author}</span>
                              <span>{new Date(n.date).toLocaleString('pt-BR')}</span>
                            </div>
                            <p className="text-slate-800">{n.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Add note field */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="Registrar nota interna..."
                          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                        />
                        <button
                          type="button"
                          onClick={handleAddQuoteNote}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#101820] hover:bg-slate-800 rounded-lg"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONTEÚDO & BLOG (CMS EMPRESARIAL EquiparLoc) */}
          {activeTab === 'conteudo' && (
            <BlogManager
              posts={blogPosts}
              onPostsUpdate={setBlogPosts}
              showToast={showToast}
            />
          )}

          {/* ABERTURA DO SITE (hero) */}
          {activeTab === 'abertura' && currentUser.role === 'admin' && <HeroManager showToast={showToast} />}

          {/* TAB 5: CONFIGURAÇÕES */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Configurações Gerais da Empresa</h2>
                <p className="text-xs text-slate-500">Atualize dados cadastrais, canais de WhatsApp e integrações analíticas.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Razão Social</label>
                    <input
                      type="text"
                      value={settings.companyName}
                      onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={settings.cnpj}
                      onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp de Atendimento (Apenas números com DDD)</label>
                    <input
                      type="text"
                      value={settings.whatsapp}
                      onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone Fixo / Central</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail Comercial</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço do Pátio Central</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID Google Analytics 4 (GA4)</label>
                  <input
                    type="text"
                    value={settings.gaMeasurementId}
                    onChange={(e) => setSettings({ ...settings, gaMeasurementId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500] font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg transition-colors shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
