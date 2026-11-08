'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Category, CategoryGroup, CategoryWithCount, CATEGORY_GROUP_LABELS } from '@/lib/types';
import { Plus, Edit, Trash2, X, Save, Loader2, ImageOff, Hammer, Truck, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import { PhotoManager } from './PhotoManager';
import { categoryPath } from '@/lib/site';


interface CategoryManagerProps {
  categories: CategoryWithCount[];
  onChange: (categories: CategoryWithCount[]) => void;
  /** Quantos itens (ativos ou não) usam cada categoria, para avisos de exclusão */
  usage: Record<string, number>;
  showToast: (msg: string) => void;
}

type Draft = Partial<Category> & { group: CategoryGroup };

const EMPTY_DRAFT = (group: CategoryGroup): Draft => ({ name: '', group, description: '', image: '' });

export function CategoryManager({ categories, onChange, usage, showToast }: CategoryManagerProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryWithCount | null>(null);
  const [moving, setMoving] = useState(false);

  const openNew = (group: CategoryGroup) => {
    setError(null);
    setDraft(EMPTY_DRAFT(group));
  };

  const openEdit = (cat: CategoryWithCount) => {
    setError(null);
    setDraft({ ...cat });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
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
      // Recarrega a lista (o servidor recalcula contagens e renomeações)
      const listRes = await fetch('/api/categorias');
      const list = await listRes.json();
      onChange(list.categories);
      setDraft(null);
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
        onChange(categories.filter((c) => c.id !== cat.id));
        showToast(`Categoria "${cat.name}" excluída.`);
      }
    } catch {
      showToast('Sem conexão com o servidor. Tente novamente.');
    } finally {
      setConfirmDelete(null);
    }
  };

  /** Troca a posição de duas categorias do mesmo grupo (a ordem vale para o site todo). */
  const move = async (list: CategoryWithCount[], index: number, dir: -1 | 1) => {
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b || moving) return;
    setMoving(true);
    try {
      // Renumera o grupo inteiro para não haver empate de ordem
      const reordered = [...list];
      [reordered[index], reordered[index + dir]] = [b, a];
      const base = Math.min(...list.map((c) => c.order));
      const changed = reordered
        .map((c, i) => ({ ...c, order: base + i }))
        .filter((c) => c.order !== list.find((o) => o.id === c.id)?.order);
      for (const c of changed) {
        const res = await fetch(`/api/categorias/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...c, order: c.order }),
        });
        if (!res.ok) throw new Error();
      }
      const listRes = await fetch('/api/categorias');
      onChange((await listRes.json()).categories);
    } catch {
      showToast('Não foi possível mudar a ordem. Tente novamente.');
    } finally {
      setMoving(false);
    }
  };

  const groups: CategoryGroup[] = ['maquinas', 'ferramentas'];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Categorias</h2>
          <p className="text-xs text-slate-500">
            Organize o catálogo em máquinas pesadas e ferramentas. Categorias sem itens ativos ficam ocultas no site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNew('maquinas')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nova categoria</span>
        </button>
      </div>

      {groups.map((group) => {
        const list = categories.filter((c) => c.group === group).sort((x, y) => x.order - y.order);
        const Icon = group === 'maquinas' ? Truck : Hammer;
        return (
          <section key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Icon className="w-4 h-4 text-[#FF6500]" />
                {CATEGORY_GROUP_LABELS[group]}
                <span className="text-xs font-normal text-slate-500">({list.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => openNew(group)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar em {CATEGORY_GROUP_LABELS[group].toLowerCase()}</span>
              </button>
            </div>

            {list.length === 0 ? (
              <p className="p-6 text-xs text-slate-500">
                Nenhuma categoria aqui ainda. Use &quot;Adicionar&quot; para criar a primeira.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.map((cat, index) => {
                  const total = usage[cat.name] || 0;
                  return (
                    <li key={cat.id} className="p-4 flex items-center gap-4">
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          onClick={() => move(list, index, -1)}
                          disabled={index === 0 || moving}
                          className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-25"
                          aria-label={`Subir ${cat.name}`}
                          title="Subir"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(list, index, 1)}
                          disabled={index === list.length - 1 || moving}
                          className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-25"
                          aria-label={`Descer ${cat.name}`}
                          title="Descer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                        {cat.image ? (
                          <Image src={cat.image} alt="" fill sizes="56px" className="object-cover" />
                        ) : (
                          <ImageOff className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 truncate">{cat.name}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{cat.description || 'Sem descrição'}</div>
                        <div className="text-[11px] mt-1">
                          {cat.count > 0 ? (
                            <span className="text-emerald-700">{cat.count} ativo(s) · visível no site</span>
                          ) : (
                            <span className="text-amber-700">Sem itens ativos · oculta no site</span>
                          )}
                          {total > cat.count && (
                            <span className="text-slate-400"> · {total - cat.count} em rascunho</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {cat.count > 0 && (
                          <a
                            href={categoryPath(cat.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                            aria-label={`Ver ${cat.name} no site`}
                            title="Ver no site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(cat)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          aria-label={`Editar ${cat.name}`}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(cat)}
                          className="p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          aria-label={`Excluir ${cat.name}`}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}

      {/* Formulário (criar / editar) */}
      {draft && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="categoria-form-titulo"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !saving && setDraft(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[calc(100vh-2rem)] bg-white rounded-xl shadow-xl overflow-y-auto"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 id="categoria-form-titulo" className="text-sm font-bold text-slate-900">
                {draft.id ? `Editar categoria` : 'Nova categoria'}
              </h3>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <fieldset>
                <legend className="block text-xs font-semibold text-slate-700 mb-1.5">Linha de produto</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['maquinas', 'ferramentas'] as CategoryGroup[]).map((g) => (
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

              <div>
                <label htmlFor="categoria-nome" className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome *
                </label>
                <input
                  id="categoria-nome"
                  type="text"
                  required
                  autoFocus
                  maxLength={60}
                  value={draft.name || ''}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder={draft.group === 'ferramentas' ? 'Ex: Ferramentas Elétricas' : 'Ex: Terraplenagem & Escavação'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                />
                {draft.id && (usage[categories.find((c) => c.id === draft.id)?.name || ''] || 0) > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ao renomear, os itens desta categoria são atualizados automaticamente.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="categoria-descricao" className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição curta
                </label>
                <textarea
                  id="categoria-descricao"
                  rows={2}
                  maxLength={160}
                  value={draft.description || ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Aparece no card da categoria na página inicial."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                />
                <p className="text-[11px] text-slate-400 mt-0.5 text-right">{(draft.description || '').length}/160</p>
              </div>

              <div>
                <p className="block text-xs font-semibold text-slate-700 mb-1">Foto da categoria</p>
                <PhotoManager
                  single
                  photos={draft.image ? [draft.image] : []}
                  main={draft.image || ''}
                  nameHint={draft.name ? `categoria-${draft.name}` : 'categoria'}
                  onChange={(_photos, main) => setDraft({ ...draft, image: main })}
                />
                {draft.image?.startsWith('/images/cat_') && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Esta é uma foto genérica do modelo do site. Envie uma foto real da categoria.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="categoria-ordem" className="block text-xs font-semibold text-slate-700 mb-1">
                  Ordem de exibição
                </label>
                <input
                  id="categoria-ordem"
                  type="number"
                  min={0}
                  value={draft.order ?? ''}
                  onChange={(e) => setDraft({ ...draft, order: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="Automática (vai para o fim)"
                  className="w-40 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  {error}
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{draft.id ? 'Salvar categoria' : 'Criar categoria'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

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
            {(usage[confirmDelete.name] || 0) > 0 ? (
              <p className="text-xs text-slate-600">
                Esta categoria tem {usage[confirmDelete.name]} item(ns). Mova-os para outra categoria em
                Equipamentos antes de excluir.
              </p>
            ) : (
              <p className="text-xs text-slate-600">A categoria não tem itens e será removida do catálogo.</p>
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
                disabled={(usage[confirmDelete.name] || 0) > 0}
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
