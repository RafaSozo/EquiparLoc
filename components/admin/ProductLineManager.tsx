'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus } from 'lucide-react';
import type { CategoryWithCount, ProductLine, ProductLineKind } from '@/lib/types';
import { PRODUCT_LINE_KIND_LABELS } from '@/lib/types';
import { sortLines } from '@/lib/category-tree';

interface ProductLineManagerProps {
  lines: ProductLine[];
  onChange: (lines: ProductLine[]) => void;
  categories: CategoryWithCount[];
  /** Recarrega as categorias (quando a exclusão de uma linha move categorias) */
  onCategoriesReload: () => Promise<void>;
  showToast: (msg: string) => void;
}

type LineDraft = { id?: string; name: string; kind: ProductLineKind; description: string };

const EMPTY: LineDraft = { name: '', kind: 'locacao', description: '' };

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent';

const KIND_HINTS: Record<ProductLineKind, string> = {
  locacao: 'Aparece no menu Locação e na página /locacao.',
  servico: 'Aparece no menu Serviços e na página /servicos.',
};

/**
 * Linhas de produto: o primeiro nível do catálogo (ex.: Máquinas pesadas, Ferramentas, Serviços).
 * Cada linha é do tipo Locação ou Serviço, e isso decide em que parte do site ela aparece.
 */
export function ProductLineManager({ lines, onChange, categories, onCategoriesReload, showToast }: ProductLineManagerProps) {
  const [draft, setDraft] = useState<LineDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ProductLine | null>(null);
  const [moveTo, setMoveTo] = useState('');
  const [busy, setBusy] = useState(false);

  const sorted = sortLines(lines);
  const countOf = (id: string) => categories.filter((c) => c.group === id).length;

  const reload = async () => {
    const data = await fetch('/api/linhas').then((r) => r.json());
    onChange(data.lines);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) return setError('Escreva o nome da linha.');
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(draft.id ? `/api/linhas/${draft.id}` : '/api/linhas', {
        method: draft.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lines.find((l) => l.id === draft.id), ...draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar a linha.');
      await reload();
      showToast(draft.id ? `Linha "${data.name}" salva.` : `Linha "${data.name}" criada.`);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a linha.');
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = sorted[index];
    const b = sorted[index + dir];
    if (!a || !b || busy) return;
    setBusy(true);
    try {
      const reordered = [...sorted];
      [reordered[index], reordered[index + dir]] = [b, a];
      for (const [i, line] of reordered.entries()) {
        if (line.order === i + 1) continue;
        const res = await fetch(`/api/linhas/${line.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...line, order: i + 1 }),
        });
        if (!res.ok) throw new Error();
      }
      await reload();
    } catch {
      showToast('Não foi possível mudar a ordem. Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (line: ProductLine) => {
    setBusy(true);
    try {
      const qs = countOf(line.id) ? `?moverPara=${encodeURIComponent(moveTo)}` : '';
      const res = await fetch(`/api/linhas/${line.id}${qs}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível excluir a linha.');
      await reload();
      await onCategoriesReload();
      showToast(`Linha "${line.name}" excluída.`);
      setConfirmDelete(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível excluir a linha.');
    } finally {
      setBusy(false);
    }
  };

  const deleteCount = confirmDelete ? countOf(confirmDelete.id) : 0;

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs">
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Linhas de produto</h3>
          <p className="text-xs text-slate-500">O primeiro nível do catálogo. Cada categoria pertence a uma linha.</p>
        </div>
        {!draft && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setDraft({ ...EMPTY });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#C24E00] border border-[#FF6500] hover:bg-[#FF6500] hover:text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nova linha
          </button>
        )}
      </div>

      {draft && (
        <form onSubmit={save} className="p-4 border-b border-slate-200 bg-orange-50/50 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="linha-nome" className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da linha *
              </label>
              <input
                id="linha-nome"
                autoFocus
                maxLength={40}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Ex.: Andaimes e escoras"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="linha-descricao" className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição (opcional)
              </label>
              <textarea
                id="linha-descricao"
                rows={2}
                maxLength={200}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Uma frase sobre esta linha."
                className={inputCls}
              />
            </div>
          </div>
          <fieldset>
            <legend className="block text-xs font-semibold text-slate-700 mb-1.5">Tipo</legend>
            <div className="space-y-2">
              {(Object.keys(PRODUCT_LINE_KIND_LABELS) as ProductLineKind[]).map((k) => (
                <label
                  key={k}
                  className={`flex items-start gap-2 p-2.5 border rounded-lg cursor-pointer ${
                    draft.kind === k ? 'border-[#FF6500] bg-white' : 'border-slate-200 bg-white/60 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="linha-tipo"
                    checked={draft.kind === k}
                    onChange={() => setDraft({ ...draft, kind: k })}
                    className="mt-0.5 text-[#FF6500] focus:ring-[#FF6500]"
                  />
                  <span className="text-sm text-slate-800">
                    <span className="font-semibold">{PRODUCT_LINE_KIND_LABELS[k]}</span>
                    <span className="block text-xs text-slate-500">{KIND_HINTS[k]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="md:col-span-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              {error}
            </p>
          )}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-60"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {draft.id ? 'Salvar linha' : 'Criar linha'}
            </button>
            <button type="button" onClick={() => setDraft(null)} className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <ul className="divide-y divide-slate-100">
        {sorted.map((line, i) => {
          const n = countOf(line.id);
          return (
            <li key={line.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || busy}
                  className="p-0.5 text-slate-400 hover:text-slate-900 rounded disabled:opacity-20"
                  aria-label={`Subir ${line.name}`}
                  title="Subir"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === sorted.length - 1 || busy}
                  className="p-0.5 text-slate-400 hover:text-slate-900 rounded disabled:opacity-20"
                  aria-label={`Descer ${line.name}`}
                  title="Descer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-bold text-slate-900">{line.name}</span>
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      line.kind === 'servico' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {PRODUCT_LINE_KIND_LABELS[line.kind]}
                  </span>
                </p>
                {line.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{line.description}</p>}
                <div className="mt-1 flex flex-wrap gap-x-1 text-xs text-slate-300">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDraft({ id: line.id, name: line.name, kind: line.kind, description: line.description });
                    }}
                    className="px-0.5 font-semibold text-slate-600 hover:text-[#C24E00] hover:underline"
                  >
                    Editar
                  </button>
                  |
                  <button
                    type="button"
                    onClick={() => {
                      setMoveTo('');
                      setConfirmDelete(line);
                    }}
                    disabled={lines.length <= 1}
                    className="px-0.5 font-semibold text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                {n} {n === 1 ? 'categoria' : 'categorias'}
              </span>
            </li>
          );
        })}
      </ul>

      {confirmDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="linha-excluir-titulo"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !busy && setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-xl shadow-xl p-5 space-y-4">
            <h3 id="linha-excluir-titulo" className="text-base font-bold text-slate-900">
              Excluir a linha &quot;{confirmDelete.name}&quot;?
            </h3>
            {deleteCount > 0 ? (
              <div className="space-y-1.5">
                <label htmlFor="linha-mover" className="block text-sm text-slate-700">
                  {deleteCount === 1 ? 'Há 1 categoria' : `Há ${deleteCount} categorias`} nesta linha. Para qual linha{' '}
                  {deleteCount === 1 ? 'ela vai' : 'elas vão'}? Os produtos continuam nas categorias.
                </label>
                <select id="linha-mover" value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`${inputCls} bg-white`}>
                  <option value="">Escolha a linha...</option>
                  {sorted
                    .filter((l) => l.id !== confirmDelete.id)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Esta linha não tem categorias.</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy || (deleteCount > 0 && !moveTo)}
                onClick={() => remove(confirmDelete)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {deleteCount > 0 ? 'Mover categorias e excluir' : 'Excluir linha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
