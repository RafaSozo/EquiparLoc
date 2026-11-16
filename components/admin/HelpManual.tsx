'use client';

import React from 'react';
import {
  BookOpen,
  Truck,
  Tags,
  FileSpreadsheet,
  Inbox,
  FileText,
  ImageIcon,
  Building2,
  Settings,
  Camera,
  LifeBuoy,
} from 'lucide-react';

/** Telas do painel para onde o manual pode levar */
export type ManualTarget = 'equipamentos' | 'categorias' | 'orcamentos' | 'contatos' | 'conteudo' | 'abertura' | 'empresa' | 'configuracoes';

interface Topic {
  id: string;
  target: ManualTarget;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  /** Onde fica no menu da esquerda */
  where: string;
  steps: string[];
  tip?: string;
  adminOnly?: boolean;
}

const TOPICS: Topic[] = [
  {
    id: 'produtos',
    target: 'equipamentos',
    icon: Truck,
    title: 'Cadastrar ou editar um produto',
    where: 'Menu: Produtos',
    steps: [
      'Clique em "Adicionar novo" (ou no nome de um produto para editar).',
      'Escreva o nome. O endereço da página é criado sozinho.',
      'Envie as fotos e marque com a estrela a foto principal.',
      'Preencha descrição, resumo e a ficha técnica (peso, potência, combustível...).',
      'Na coluna da direita, escolha a categoria.',
      'Em "Publicar", deixe "No site" e clique em Publicar (ou Atualizar).',
    ],
    tip: 'Use "Rascunho" para guardar sem mostrar no site. Marque "Destaque" para o produto aparecer em "Destaques para locação" na página inicial.',
  },
  {
    id: 'categorias',
    target: 'categorias',
    icon: Tags,
    title: 'Organizar categorias e linhas',
    where: 'Menu: Categorias e subcategorias',
    steps: [
      'No alto ficam as Linhas de produto (ex.: Máquinas pesadas, Ferramentas, Serviços).',
      'Para criar uma categoria: preencha o Nome à esquerda, escolha a linha e salve.',
      'Para uma subcategoria: em "Fica dentro de", escolha a categoria principal.',
      'Use as setas para mudar a ordem em que aparecem no site.',
      'Ao excluir uma categoria com produtos, o painel pede para onde mover os produtos.',
    ],
    tip: 'Categorias de uma linha do tipo "Serviço" aparecem na página Serviços, com texto próprio e a lista "O que está incluído".',
  },
  {
    id: 'orcamentos',
    target: 'orcamentos',
    icon: FileSpreadsheet,
    title: 'Atender pedidos de orçamento',
    where: 'Menu: Orçamentos CRM',
    steps: [
      'Os pedidos novos aparecem como "Novo", com um número no menu.',
      'Abra o pedido para ver o cliente, o equipamento, o período e o local da obra.',
      'Mude a situação conforme o atendimento: Em atendimento, Proposta enviada, Concluído ou Perdido.',
      'Escreva anotações no histórico (ex.: "Liguei, vai fechar segunda").',
    ],
  },
  {
    id: 'contatos',
    target: 'contatos',
    icon: Inbox,
    title: 'Responder mensagens do site',
    where: 'Menu: Mensagens de contato',
    steps: [
      'Aqui chegam as mensagens do formulário da página Contato.',
      'Abra a mensagem e responda pelos botões: e-mail, WhatsApp ou ligar.',
      'Depois de responder, clique em "Marcar como respondida".',
      'Use "Arquivar" para tirar da lista o que não precisa de resposta.',
    ],
  },
  {
    id: 'blog',
    target: 'conteudo',
    icon: FileText,
    title: 'Publicar um artigo no blog',
    where: 'Menu: Conteúdo & Blog',
    steps: [
      'Crie um novo artigo e escreva o título e o texto.',
      'Use os botões da barra para títulos, listas e links para o catálogo.',
      'Escolha a foto de capa e escreva a descrição da foto.',
      'Salve como rascunho para revisar ou clique em "Publicar Artigo".',
    ],
    tip: 'O painel mostra uma nota de SEO e sugere correções para o artigo aparecer melhor no Google.',
  },
  {
    id: 'abertura',
    target: 'abertura',
    icon: ImageIcon,
    title: 'Trocar a capa da página inicial',
    where: 'Menu: Abertura do site',
    adminOnly: true,
    steps: [
      'Altere o título, o texto e os botões do topo da página inicial.',
      'Troque a foto de fundo. Prefira uma foto deitada, com o assunto no centro.',
      'Salve e confira no site.',
    ],
  },
  {
    id: 'empresa',
    target: 'empresa',
    icon: Building2,
    title: 'Editar a página Empresa',
    where: 'Menu: Página Empresa',
    adminOnly: true,
    steps: [
      'Mude os textos: topo, "Quem somos", destaques, diretrizes e a chamada do final.',
      'Deixe uma linha em branco entre um parágrafo e outro.',
      'Troque a foto e clique em "Salvar página Empresa".',
    ],
  },
  {
    id: 'dados',
    target: 'configuracoes',
    icon: Settings,
    title: 'Mudar telefone, WhatsApp, e-mail ou horário',
    where: 'Menu: Dados da empresa',
    adminOnly: true,
    steps: [
      'Altere o que precisar: telefone, WhatsApp (só números, com DDD), e-mail, endereço e horário.',
      'No horário, use a barra | para separar linhas. Ex.: Segunda a Sexta: 08h às 17h | Sábado: 08h às 12h',
      'Clique em "Salvar dados da empresa". O site inteiro passa a mostrar os novos dados.',
    ],
  },
];

const PHOTO_TIPS = [
  'Tamanho ideal: 1200 × 900 pixels, foto deitada (proporção 4:3).',
  'Mínimo de 500 pixels de largura. Até 12 MB por foto (JPG, PNG ou WEBP).',
  'Equipamento inteiro e centralizado, de preferência em fundo branco ou claro.',
  'Sem textos, telefones ou marcas d’água por cima da foto.',
  'O site não corta a foto: ela aparece inteira, centralizada no quadro.',
];

interface HelpManualProps {
  isAdmin: boolean;
  /** Abre a tela correspondente no painel */
  onGo: (target: ManualTarget) => void;
}

/** Manual simples do painel, sempre disponível no menu. */
export function HelpManual({ isAdmin, onGo }: HelpManualProps) {
  const topics = TOPICS.filter((t) => isAdmin || !t.adminOnly);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-orange-50 text-[#FF6500]">
          <BookOpen className="w-6 h-6" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Manual do painel</h2>
          <p className="text-sm text-slate-600">
            Passo a passo das tarefas do dia a dia. Clique num assunto para abrir. O que você salva aparece no site na hora.
          </p>
        </div>
      </div>

      <nav aria-label="Assuntos do manual" className="flex flex-wrap gap-2">
        {topics.map((t) => (
          <a
            key={t.id}
            href={`#manual-${t.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:border-[#FF6500] hover:text-slate-900"
          >
            {t.title}
          </a>
        ))}
        <a
          href="#manual-fotos"
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-full hover:border-[#FF6500] hover:text-slate-900"
        >
          Fotos no tamanho certo
        </a>
      </nav>

      <div className="space-y-3">
        {topics.map((t, i) => {
          const Icon = t.icon;
          return (
            <details
              key={t.id}
              id={`manual-${t.id}`}
              open={i === 0}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden scroll-mt-4"
            >
              <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <Icon className="w-5 h-5 text-[#FF6500] shrink-0" aria-hidden="true" />
                <span className="flex-1 text-sm font-bold text-slate-900">{t.title}</span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">{t.where}</span>
                <span className="text-lg leading-none text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true">
                  ›
                </span>
              </summary>
              <div className="px-5 pb-5 pt-1 space-y-3">
                <p className="text-xs text-slate-500 sm:hidden">{t.where}</p>
                <ol className="space-y-2">
                  {t.steps.map((s, n) => (
                    <li key={n} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold shrink-0">
                        {n + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                {t.tip && (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <strong className="text-slate-800">Dica: </strong>
                    {t.tip}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onGo(t.target)}
                  className="text-xs font-semibold text-[#C24D00] underline underline-offset-4 hover:text-slate-900"
                >
                  Abrir esta tela
                </button>
              </div>
            </details>
          );
        })}
      </div>

      <section id="manual-fotos" className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3 scroll-mt-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Camera className="w-5 h-5 text-[#FF6500]" aria-hidden="true" />
          Fotos no tamanho certo
        </h3>
        <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
          {PHOTO_TIPS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-3">
        <LifeBuoy className="w-5 h-5 text-[#FF6500] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-bold text-slate-900">Algo deu errado?</p>
          <p>
            Se aparecer &ldquo;Sua sessão expirou&rdquo;, saia e entre de novo no painel. Se uma mudança não aparecer no site,
            recarregue a página do site. O sistema guarda uma cópia de segurança do conteúdo todos os dias.
          </p>
        </div>
      </section>
    </div>
  );
}
