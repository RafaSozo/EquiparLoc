'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { Category, CategoryGroup, CategoryWithCount, CATEGORY_GROUP_LABELS } from '@/lib/types';
import { Loader2, ImageOff, ArrowUp, ArrowDown, CornerDownRight } from 'lucide-react';
import { PhotoManager } from './PhotoManager';
import { categoryPath } from '@/lib/site';
import { CATEGORY_GROUPS, categoryTree, childrenOf, parentOf } from '@/lib/category-tree';

interface CategoryManagerProps {
  categories: CategoryWithCount[];
  onChange: (categories: CategoryWithCount[]) => void;
  /** Quantos itens (ativos ou não) usam cada categoria, para avisos de exclusão */
  usage: Record<string, number>;
  showToast: (msg: string) => void;
}

type Draft = Partial<Category> & { group: CategoryGroup; parentId: string };

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
export function CategoryManager({ categories, onChange, usage, showToast }: CategoryManagerProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryWithCount | null>(null);
  const [moving, setMoving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const editing = draft.id ? categories.find((c) => c.id === draft.id) : undefined;
  const editingHasChildren = editing ? childrenOf(editing, categories).length > 0 : false;
  const chosenParent = draft.parentId ? categories.find((c) => c.id === draft.parentId) : undefined;
  // Só categorias principais podem receber subcategorias
  const parentOptions = (g: CategoryGroup) =>
    categoryTree(categories, g)
      .filter((r) => r.depth === 0 && r.cat.id !== draft.id)
      .map((r) => r.cat);

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => nameRef.current?.focus(), 250);
  };

  const startNew = (group?: CategoryGroup, parentId = '') => {
    setError(null);
    setDraft(EMPTY_DRAFT(group, parentId));
    focusForm();
  };

  const startEdit = (cat: CategoryWithCount) => {
    setError(null);
    const { count: _count, ...rest } = cat;
    setDraft({ ...rest, parentId: parentOf(cat, categories)?.id || '' });
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
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Não foi possível salvar a categoria.');
        return;
      }
      await reload();
      // Depois de criar, deixa o formulário pronto para a próxima, na mesma principal
      setDraft(isNew ? EMPTY_DRAFT(data.group, draft.parentId) : EMPTY_DRAFT());
      showToast(isNew ? `Categoria "${data.name}" criada.` : `Categoria "${data.name}" salva.`);
    } catch {
      setError('Sem conexão com o servidor. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryWithCount) => {
    try {
      const res = await fetch(`/api/categorias/${cat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Não foi possível excluir a categoria.');
      } else {
        await reload();
        if (draft.id === cat.id) setDraft(EMPTY_DRAFT());
        showToast(`Categoria "${cat.name}" excluída.`);
      }
    } catch {
      showToast('Sem conexão com o servidor. Tente novamente.');
    } finally {
      setConfirmDelete(null);
    }
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

  const deleteChildren = confirmDelete ? childrenOf(confirmDelete, categories) : [];
  const deleteUsage = confirmDelete ? usage[confirmDelete.name] || 0 : 0;

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
                <div className="grid grid-cols-2 gap-2">
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
                    setDraft(EMPTY_DRAFT());
                  }}
                  className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Lista em árvore */}
        <div className="space-y-5 min-w-0">
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
                        <th className="w-10 px-2 py-2">
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
                          <tr key={cat.id} className={`group align-top ${isEditing ? 'bg-orange-50' : depth ? 'bg-slate-50/50' : ''}`}>
                            <td className="px-2 py-3">
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
                                    |<RowAction danger onClick={() => setConfirmDelete(cat)}>Excluir</RowAction>
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
          onClick={() => setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-xl shadow-xl p-5 space-y-4">
            <h3 id="categoria-excluir-titulo" className="text-sm font-bold text-slate-900">
              Excluir &quot;{confirmDelete.name}&quot;?
            </h3>
            {deleteUsage > 0 ? (
              <p className="text-xs text-slate-600">
                Esta categoria tem {deleteUsage} {deleteUsage === 1 ? 'item' : 'itens'}. Mova-os para outra categoria no
                Catálogo antes de excluir.
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                A categoria não tem itens e será removida.
                {deleteChildren.length > 0 &&
                  ` As subcategorias (${deleteChildren.map((c) => c.name).join(', ')}) viram categorias principais.`}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteUsage > 0}
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Excluir categoria
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
