'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import type { Category, CategoryGroup, CategoryWithCount, ProductLine } from '@/lib/types';
import { ProductLineManager } from './ProductLineManager';
import { Loader2, ImageOff, ArrowUp, ArrowDown, CornerDownRight } from 'lucide-react';
import { PhotoManager } from './PhotoManager';
import { categoryPath } from '@/lib/site';
import { categoryTree, childrenOf, parentOf, sortLines } from '@/lib/category-tree';

interface CategoryManagerProps {
  categories: CategoryWithCount[];
  onChange: (categories: CategoryWithCount[]) => void;
  /** Quantos itens (ativos ou não) usam cada categoria, para avisos de exclusão */
  usage: Record<string, number>;
  showToast: (msg: string) => void;
  /** Linhas de produto (Máquinas pesadas, Ferramentas, Serviços...) */
  lines: ProductLine[];
  onLinesChange: (lines: ProductLine[]) => void;
  /** Avisa o painel que os itens de uma categoria excluída foram para outra */
  onItemsMoved?: (from: string, to: string) => void;
}

type Draft = Partial<Category> & { group: CategoryGroup; parentId: string; highlightsText?: string };

const EMPTY_DRAFT = (group: CategoryGroup = 'maquinas', parentId = ''): Draft => ({
  name: '',
  group,
  parentId,
  description: '',
  image: '',
});

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent';

/**
 * Tela de categorias no jeito do WordPress: formulário à esquerda ("Adicionar nova categoria")
 * e a lista à direita, com as subcategorias recuadas embaixo da principal.
 */
export function CategoryManager({ categories, onChange, usage, showToast, onItemsMoved, lines, onLinesChange }: CategoryManagerProps) {
  const sortedLines = sortLines(lines);
  const CATEGORY_GROUPS = sortedLines.map((l) => l.id);
  const CATEGORY_GROUP_LABELS: Record<string, string> = Object.fromEntries(lines.map((l) => [l.id, l.name]));
  const firstLine = CATEGORY_GROUPS[0] || 'maquinas';
  const [draft, setDraft] = useState<Draft>(() => EMPTY_DRAFT(firstLine));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryWithCount[] | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [moving, setMoving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const editing = draft.id ? categories.find((c) => c.id === draft.id) : undefined;
  const editingHasChildren = editing ? childrenOf(editing, categories).length > 0 : false;
  const chosenParent = draft.parentId ? categories.find((c) => c.id === draft.parentId) : undefined;
  // Categorias de linhas do tipo Serviço ganham texto completo para a página /servicos
  const draftIsService = lines.find((l) => l.id === (chosenParent?.group || draft.group))?.kind === 'servico';
  // Só categorias principais podem receber subcategorias
  const parentOptions = (g: CategoryGroup) =>
    categoryTree(categories, g)
      .filter((r) => r.depth === 0 && r.cat.id !== draft.id)
      .map((r) => r.cat);

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => nameRef.current?.focus(), 250);
  };

  const startNew = (group: CategoryGroup = firstLine, parentId = '') => {
    setError(null);
    setDraft(EMPTY_DRAFT(group, parentId));
    focusForm();
  };

  const startEdit = (cat: CategoryWithCount) => {
    setError(null);
    const { count: _count, ...rest } = cat;
    setDraft({ ...rest, parentId: parentOf(cat, categories)?.id || '', highlightsText: (cat.highlights || []).join('\n') });
    focusForm();
  };

  const reload = async () => {
    const listRes = await fetch('/api/categorias');
    const list = await listRes.json();
    onChange(list.categories);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name?.trim()) {
      setError('Informe o nome da categoria.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isNew = !draft.id;
      const res = await fetch(isNew ? '/api/categorias' : `/api/categorias/${draft.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          highlightsText: undefined,
          highlights: (draft.highlightsText || '')
            .split('\n')
            .map((h) => h.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível salvar a categoria.');
        return;
      }
      await reload();
      // Depois de criar, deixa o formulário pronto para a próxima, na mesma principal
      setDraft(isNew ? EMPTY_DRAFT(data.group, draft.parentId) : EMPTY_DRAFT(firstLine));
      showToast(isNew ? `Categoria "${data.name}" criada.` : `Categoria "${data.name}" salva.`);
    } catch {
      setError('Sem conexão com o servidor. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (list: CategoryWithCount[]) => {
    setMoveTo('');
    setConfirmDelete(list);
  };

  /** Exclui uma ou várias categorias; os itens delas vão para a categoria escolhida. */
  const handleDelete = async (list: CategoryWithCount[]) => {
    setDeleting(true);
    let done = 0;
    let failMsg = '';
    // Subcategorias primeiro, para não promover à toa as que também serão excluídas
    const ordered = [...list].sort((a, b) => Number(!parentOf(a, categories)) - Number(!parentOf(b, categories)));
    for (const cat of ordered) {
      const hasItems = (usage[cat.name] || 0) > 0;
      try {
        const qs = hasItems ? `?moverPara=${encodeURIComponent(moveTo)}` : '';
        const res = await fetch(`/api/categorias/${cat.id}${qs}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          failMsg = data.error || `Não foi possível excluir "${cat.name}".`;
          continue;
        }
        if (hasItems) onItemsMoved?.(cat.name, moveTo);
        if (draft.id === cat.id) setDraft(EMPTY_DRAFT(firstLine));
        done++;
      } catch {
        failMsg = 'Sem conexão com o servidor. Tente novamente.';
      }
    }
    try {
      await reload();
    } catch {
      /* a lista recarrega na próxima ação */
    }
    setDeleting(false);
    setConfirmDelete(null);
    setSelected(new Set());
    if (failMsg) showToast(done ? `${done} excluída(s). ${failMsg}` : failMsg);
    else showToast(done === 1 ? `Categoria "${list[0].name}" excluída.` : `${done} categorias excluídas.`);
  };

  /** Troca a posição com a vizinha (entre principais, ou entre subcategorias da mesma principal). */
  const move = async (siblings: CategoryWithCount[], index: number, dir: -1 | 1) => {
    const a = siblings[index];
    const b = siblings[index + dir];
    if (!a || !b || moving) return;
    setMoving(true);
    try {
      const reordered = [...siblings];
      [reordered[index], reordered[index + dir]] = [b, a];
      const base = Math.min(...siblings.map((c) => c.order));
      const changed = reordered
        .map((c, i) => ({ ...c, order: base + i }))
        .filter((c) => c.order !== siblings.find((o) => o.id === c.id)?.order);
      for (const c of changed) {
        const { count: _count, ...rest } = c;
        const res = await fetch(`/api/categorias/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...rest, parentId: parentOf(c, categories)?.id || '' }),
        });
        if (!res.ok) throw new Error();
      }
      await reload();
    } catch {
      showToast('Não foi possível mudar a ordem. Tente novamente.');
    } finally {
      setMoving(false);
    }
  };

  const siblingsOf = (cat: CategoryWithCount) => {
    const parent = parentOf(cat, categories);
    return parent
      ? childrenOf(parent, categories)
      : categoryTree(categories, cat.group)
          .filter((r) => r.depth === 0)
          .map((r) => r.cat);
  };

  const deleteIds = new Set((confirmDelete || []).map((c) => c.id));
  const deleteUsage = (confirmDelete || []).reduce((n, c) => n + (usage[c.name] || 0), 0);
  // Subcategorias que sobram e viram principais
  const deleteChildren = (confirmDelete || []).flatMap((c) => childrenOf(c, categories)).filter((c) => !deleteIds.has(c.id));
  const toggleSelected = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Categorias</h2>
        <p className="text-sm text-slate-500 mt-0.5 max-w-3xl">
          Crie as categorias principais (ex.: Concretagem) e, dentro delas, as subcategorias (ex.: Betoneiras,
          Vibradores). No site, a principal mostra todos os itens das subcategorias. Categorias sem itens no site ficam
          escondidas.
        </p>
      </div>

      <ProductLineManager
        lines={lines}
        onChange={onLinesChange}
        categories={categories}
        onCategoriesReload={reload}
        showToast={showToast}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-5 items-start">
        {/* Formulário: adicionar ou editar */}
        <form
          ref={formRef}
          onSubmit={handleSave}
          className={`bg-white border rounded-xl shadow-xs lg:sticky lg:top-4 scroll-mt-4 ${
            draft.id ? 'border-[#FF6500] ring-1 ring-[#FF6500]' : 'border-slate-200'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              {draft.id ? `Editar "${editing?.name || draft.name}"` : chosenParent ? `Nova subcategoria de "${chosenParent.name}"` : 'Adicionar nova categoria'}
            </h3>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label htmlFor="categoria-nome" className="block text-xs font-semibold text-slate-700 mb-1">
                Nome *
              </label>
              <input
                ref={nameRef}
                id="categoria-nome"
                type="text"
                required
                maxLength={60}
                value={draft.name || ''}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={chosenParent ? 'Ex.: Betoneiras' : 'Ex.: Concretagem'}
                className={inputCls}
              />
              {editing && (usage[editing.name] || 0) > 0 && (
                <p className="text-[11px] text-slate-500 mt-1">Ao renomear, os itens desta categoria acompanham.</p>
              )}
            </div>

            <div>
              <label htmlFor="categoria-pai" className="block text-xs font-semibold text-slate-700 mb-1">
                Fica dentro de
              </label>
              <select
                id="categoria-pai"
                value={draft.parentId}
                disabled={editingHasChildren}
                onChange={(e) => {
                  const parent = categories.find((c) => c.id === e.target.value);
                  setDraft({ ...draft, parentId: e.target.value, group: parent?.group || draft.group });
                }}
                className={`${inputCls} bg-white disabled:bg-slate-100`}
              >
                <option value="">Nenhuma: é uma categoria principal</option>
                {CATEGORY_GROUPS.map((g) => {
                  const list = parentOptions(g);
                  if (!list.length) return null;
                  return (
                    <optgroup key={g} label={CATEGORY_GROUP_LABELS[g]}>
                      {list.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {editingHasChildren
                  ? 'Esta categoria tem subcategorias, por isso continua como principal.'
                  : chosenParent
                    ? `Vai aparecer como subcategoria de ${chosenParent.name}.`
                    : 'Escolha uma categoria para transformar esta em subcategoria.'}
              </p>
            </div>

            {!chosenParent && (
              <fieldset>
                <legend className="block text-xs font-semibold text-slate-700 mb-1.5">Linha de produto</legend>
                <div className="grid grid-cols-1 gap-1.5">
                  {CATEGORY_GROUPS.map((g) => (
                    <label
                      key={g}
                      className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer text-xs ${
                        draft.group === g ? 'border-[#FF6500] bg-orange-50 font-semibold' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="grupo"
                        checked={draft.group === g}
                        onChange={() => setDraft({ ...draft, group: g })}
                        className="text-[#FF6500] focus:ring-[#FF6500]"
                      />
                      {CATEGORY_GROUP_LABELS[g]}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label htmlFor="categoria-descricao" className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição
              </label>
              <textarea
                id="categoria-descricao"
                rows={3}
                maxLength={160}
                value={draft.description || ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Uma frase que aparece no topo da página da categoria."
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-0.5 text-right">{(draft.description || '').length}/160</p>
            </div>

            {draftIsService && (
              <>
                <div>
                  <label htmlFor="categoria-conteudo" className="block text-xs font-semibold text-slate-700 mb-1">
                    Texto do serviço
                  </label>
                  <textarea
                    id="categoria-conteudo"
                    rows={6}
                    value={draft.content || ''}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    placeholder="Explique o serviço. Deixe uma linha em branco entre os parágrafos."
                    className={inputCls}
                  />
                  <p className="text-[11px] text-slate-500 mt-0.5">Aparece na página Serviços.</p>
                </div>
                <div>
                  <label htmlFor="categoria-inclui" className="block text-xs font-semibold text-slate-700 mb-1">
                    O que está incluído
                  </label>
                  <textarea
                    id="categoria-inclui"
                    rows={4}
                    value={draft.highlightsText || ''}
                    onChange={(e) => setDraft({ ...draft, highlightsText: e.target.value })}
                    placeholder={'Um item por linha. Ex.:\nEscavação para fundações\nAbertura de valas'}
                    className={inputCls}
                  />
                </div>
              </>
            )}

            <div>
              <p className="block text-xs font-semibold text-slate-700 mb-1">Foto</p>
              <PhotoManager
                single
                photos={draft.image ? [draft.image] : []}
                main={draft.image || ''}
                nameHint={draft.name ? `categoria-${draft.name}` : 'categoria'}
                onChange={(_photos, main) => setDraft({ ...draft, image: main })}
              />
              {draft.image?.startsWith('/images/cat_') && (
                <p className="text-[11px] text-amber-700 mt-1">Foto genérica do modelo do site. Envie uma foto real.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {draft.id ? 'Salvar alterações' : chosenParent ? 'Adicionar subcategoria' : 'Adicionar categoria'}
              </button>
              {(draft.id || draft.parentId || draft.name) && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDraft(EMPTY_DRAFT(firstLine));
                  }}
                  className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
              )}
              {editing && (
                <button
                  type="button"
                  onClick={() => askDelete([editing])}
                  className="ml-auto px-2 py-2 text-sm font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Lista em árvore */}
        <div className="space-y-5 min-w-0">
          {selected.size > 0 && (
            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 p-3 bg-slate-900 text-white rounded-xl shadow-lg">
              <span className="text-xs font-semibold">{selected.size} selecionada(s)</span>
              <button
                type="button"
                onClick={() => askDelete(categories.filter((c) => selected.has(c.id)))}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Excluir selecionadas
              </button>
              <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs text-slate-300 hover:text-white">
                Limpar seleção
              </button>
            </div>
          )}
          {CATEGORY_GROUPS.map((group) => {
            const rows = categoryTree(categories, group);
            return (
              <section key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-900">{CATEGORY_GROUP_LABELS[group]}</h3>
                  <span className="text-xs text-slate-500">
                    {rows.filter((r) => r.depth === 0).length} principais · {rows.filter((r) => r.depth === 1).length} subcategorias
                  </span>
                </div>

                {rows.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500">
                    Nenhuma categoria aqui ainda.{' '}
                    <button type="button" onClick={() => startNew(group)} className="font-semibold text-[#FF6500] hover:underline">
                      Criar a primeira
                    </button>
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sr-only sm:not-sr-only">
                      <tr className="text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100">
                        <th className="w-8 pl-3 py-2">
                          <input
                            type="checkbox"
                            aria-label={`Selecionar todas de ${CATEGORY_GROUP_LABELS[group]}`}
                            checked={rows.every((r) => selected.has(r.cat.id))}
                            onChange={(e) => {
                              const next = new Set(selected);
                              rows.forEach((r) => (e.target.checked ? next.add(r.cat.id) : next.delete(r.cat.id)));
                              setSelected(next);
                            }}
                            className="w-4 h-4 rounded text-[#FF6500] focus:ring-[#FF6500]"
                          />
                        </th>
                        <th className="w-8 px-1 py-2">
                          <span className="sr-only">Ordem</span>
                        </th>
                        <th className="px-2 py-2">Nome</th>
                        <th className="hidden md:table-cell px-2 py-2">Descrição</th>
                        <th className="px-3 py-2 text-right">Itens</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map(({ cat, depth }) => {
                        const siblings = siblingsOf(cat);
                        const index = siblings.findIndex((s) => s.id === cat.id);
                        const own = usage[cat.name] || 0;
                        const total = depth === 0 ? childrenOf(cat, categories).reduce((n, c) => n + (usage[c.name] || 0), own) : own;
                        const isEditing = draft.id === cat.id;
                        return (
                          <tr key={cat.id} className={`group align-top ${isEditing || selected.has(cat.id) ? 'bg-orange-50' : depth ? 'bg-slate-50/50' : ''}`}>
                            <td className="pl-3 py-3.5">
                              <input
                                type="checkbox"
                                aria-label={`Selecionar ${cat.name}`}
                                checked={selected.has(cat.id)}
                                onChange={() => toggleSelected(cat.id)}
                                className="w-4 h-4 rounded text-[#FF6500] focus:ring-[#FF6500]"
                              />
                            </td>
                            <td className="px-1 py-3">
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => move(siblings, index, -1)}
                                  disabled={index <= 0 || moving}
                                  className="p-0.5 text-slate-400 hover:text-slate-900 rounded disabled:opacity-20"
                                  aria-label={`Subir ${cat.name}`}
                                  title="Subir"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => move(siblings, index, 1)}
                                  disabled={index === siblings.length - 1 || moving}
                                  className="p-0.5 text-slate-400 hover:text-slate-900 rounded disabled:opacity-20"
                                  aria-label={`Descer ${cat.name}`}
                                  title="Descer"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className={`flex items-start gap-3 ${depth ? 'pl-5 sm:pl-8' : ''}`}>
                                {depth === 1 && <CornerDownRight className="w-4 h-4 mt-3 -ml-5 text-slate-300 shrink-0" aria-hidden="true" />}
                                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                  {cat.image ? (
                                    <Image src={cat.image} alt="" fill unoptimized sizes="48px" className="object-cover" />
                                  ) : (
                                    <ImageOff className="w-4 h-4 text-slate-400" aria-hidden="true" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(cat)}
                                    className={`text-left hover:text-[#FF6500] ${depth ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}
                                  >
                                    {cat.name}
                                  </button>
                                  {depth === 0 && <span className="ml-1.5 text-[10px] font-semibold text-slate-400">Principal</span>}
                                  {/* Ações da linha, como no WordPress */}
                                  <div className="mt-1 flex flex-wrap gap-x-1 text-xs text-slate-300">
                                    <RowAction onClick={() => startEdit(cat)}>Editar</RowAction>
                                    {depth === 0 && (
                                      <>
                                        |<RowAction onClick={() => startNew(cat.group, cat.id)}>Adicionar subcategoria</RowAction>
                                      </>
                                    )}
                                    {cat.count > 0 && (
                                      <>
                                        |
                                        <a
                                          href={categoryPath(cat.name)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-0.5 font-semibold text-slate-600 hover:text-[#FF6500] hover:underline"
                                        >
                                          Ver no site
                                        </a>
                                      </>
                                    )}
                                    |<RowAction danger onClick={() => askDelete([cat])}>Excluir</RowAction>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-2 py-3 text-xs text-slate-500 max-w-xs">
                              <span className="line-clamp-2">{cat.description || '—'}</span>
                            </td>
                            <td className="px-3 py-3 text-right whitespace-nowrap">
                              <span className="font-semibold tabular-nums text-slate-900">{total}</span>
                              <span className={`block text-[11px] ${cat.count > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {cat.count > 0 ? `${cat.count} no site` : 'oculta no site'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {confirmDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="categoria-excluir-titulo"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-xl shadow-xl p-5 space-y-4">
            <h3 id="categoria-excluir-titulo" className="text-base font-bold text-slate-900">
              {confirmDelete.length === 1 ? `Excluir "${confirmDelete[0].name}"?` : `Excluir ${confirmDelete.length} categorias?`}
            </h3>
            {confirmDelete.length > 1 && <p className="text-xs text-slate-600">{confirmDelete.map((c) => c.name).join(', ')}</p>}
            {deleteUsage > 0 ? (
              <div className="space-y-1.5">
                <label htmlFor="mover-para" className="block text-sm text-slate-700">
                  {deleteUsage === 1 ? 'Há 1 produto' : `Há ${deleteUsage} produtos`} {confirmDelete.length > 1 ? 'nessas categorias' : 'nesta categoria'}.
                  Para qual categoria {deleteUsage > 1 ? 'eles vão' : 'ele vai'}?
                </label>
                <select id="mover-para" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`${inputCls} bg-white`}>
                  <option value="">Escolha a categoria...</option>
                  {CATEGORY_GROUPS.map((g) => {
                    const rows = categoryTree(categories, g).filter((r) => !deleteIds.has(r.cat.id));
                    if (!rows.length) return null;
                    return (
                      <optgroup key={g} label={CATEGORY_GROUP_LABELS[g]}>
                        {rows.map(({ cat, depth }) => (
                          <option key={cat.id} value={cat.name}>
                            {depth ? `\u00A0\u00A0\u00A0— ${cat.name}` : cat.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-600">{confirmDelete.length > 1 ? 'Essas categorias não têm' : 'Esta categoria não tem'} produtos.</p>
            )}
            {deleteChildren.length > 0 && (
              <p className="text-xs text-slate-500">
                As subcategorias {deleteChildren.map((c) => c.name).join(', ')} continuam e viram categorias principais.
              </p>
            )}
            <p className="text-xs text-slate-500">A página da categoria sai do site. Isso não pode ser desfeito.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting || (deleteUsage > 0 && !moveTo)}
                onClick={() => handleDelete(confirmDelete)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {deleteUsage > 0 ? 'Mover produtos e excluir' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RowAction({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-0.5 font-semibold hover:underline ${danger ? 'text-rose-600 hover:text-rose-800' : 'text-slate-600 hover:text-[#FF6500]'}`}
    >
      {children}
    </button>
  );
}
