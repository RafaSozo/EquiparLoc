'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertTriangle, CheckCircle2, ExternalLink, ImageOff, Loader2, Plus, Save, Search, Star, Trash2, X } from 'lucide-react';
import type { CategoryWithCount, Equipment, TechnicalSpecs } from '@/lib/types';
import { CATEGORY_GROUP_LABELS } from '@/lib/types';
import { equipmentPath, slugify } from '@/lib/site';
import { CATEGORY_GROUPS, categoryLabel, categoryTree, namesInBranch } from '@/lib/category-tree';
import { PhotoManager, isPlaceholderImage } from './PhotoManager';

const FALLBACK_IMAGE = '/images/cat_escavadeira_1793461101073.jpg';

type ViewFilter = 'todos' | 'publicados' | 'rascunhos' | 'destaques' | 'incompletos';

const VIEW_LABELS: Record<ViewFilter, string> = {
  todos: 'Todos',
  publicados: 'No site',
  rascunhos: 'Rascunhos',
  destaques: 'Destaques',
  incompletos: 'Para completar',
};

/** O que falta para o item ficar bom no site (e no Google). */
export function equipmentIssues(eq: Partial<Equipment>): string[] {
  const out: string[] = [];
  if (isPlaceholderImage(eq.image)) out.push('Sem foto própria');
  if (!eq.summary?.trim()) out.push('Sem resumo');
  if ((eq.description || '').trim().length < 80) out.push('Descrição curta');
  return out;
}

const matchesView = (eq: Equipment, view: ViewFilter) => {
  if (view === 'publicados') return eq.status === 'active';
  if (view === 'rascunhos') return eq.status !== 'active';
  if (view === 'destaques') return eq.isFeatured;
  if (view === 'incompletos') return equipmentIssues(eq).length > 0;
  return true;
};

interface CatalogManagerProps {
  equipments: Equipment[];
  onChange: (list: Equipment[]) => void;
  categories: CategoryWithCount[];
  /** Avisa o painel quando uma categoria é criada de dentro do editor */
  onCategoriesChange: (list: CategoryWithCount[]) => void;
  /** Administrador pode criar, duplicar e excluir; o operador só edita */
  isAdmin: boolean;
  showToast: (msg: string) => void;
  onManageCategories: () => void;
}

async function putEquipment(id: string, data: Partial<Equipment>): Promise<Equipment> {
  const res = await fetch(`/api/equipamentos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Não foi possível salvar.');
  return body as Equipment;
}

/** Opções de categoria em árvore, para <select>: subcategorias recuadas embaixo da principal. */
function CategoryOptions({ categories }: { categories: CategoryWithCount[] }) {
  return (
    <>
      {CATEGORY_GROUPS.map((g) => {
        const rows = categoryTree(categories, g);
        if (!rows.length) return null;
        return (
          <optgroup key={g} label={CATEGORY_GROUP_LABELS[g]}>
            {rows.map(({ cat, depth }) => (
              <option key={cat.id} value={cat.name}>
                {depth ? `   — ${cat.name}` : cat.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}

/**
 * Lista de produtos no jeito do WordPress ("Todos os posts"): filtros por situação em cima,
 * filtro por categoria, e ações embaixo do nome de cada item.
 */
export function CatalogManager({
  equipments,
  onChange,
  categories,
  onCategoriesChange,
  isAdmin,
  showToast,
  onManageCategories,
}: CatalogManagerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [view, setView] = useState<ViewFilter>('todos');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Equipment> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Equipment | null>(null);

  const orphanCategories = useMemo(
    () => Array.from(new Set(equipments.map((eq) => eq.category))).filter((name) => name && !categories.some((c) => c.name === name)),
    [equipments, categories]
  );

  const branch = useMemo(() => (category ? namesInBranch(category, categories) : null), [category, categories]);

  const filtered = equipments.filter((eq) => {
    if (branch && !branch.has(eq.category)) return false;
    if (!matchesView(eq, view)) return false;
    const term = search.trim().toLowerCase();
    if (term) {
      const hay = `${eq.name} ${eq.code} ${eq.category} ${eq.summary}`.toLowerCase();
      if (!term.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const allVisibleSelected = filtered.length > 0 && filtered.every((eq) => selected.has(eq.id));

  const replace = (saved: Equipment[]) => {
    const byId = new Map(saved.map((s) => [s.id, s]));
    onChange(equipments.map((eq) => byId.get(eq.id) || eq));
  };

  const quickUpdate = async (eq: Equipment, data: Partial<Equipment>, msg: string) => {
    setBusy(eq.id);
    try {
      replace([await putEquipment(eq.id, data)]);
      showToast(msg);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setBusy(null);
    }
  };

  const bulkUpdate = async (data: Partial<Equipment>, msg: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBusy('bulk');
    const saved: Equipment[] = [];
    let failed = 0;
    for (const id of ids) {
      try {
        saved.push(await putEquipment(id, data));
      } catch {
        failed++;
      }
    }
    replace(saved);
    setBusy(null);
    setSelected(new Set());
    showToast(failed ? `${saved.length} atualizado(s), ${failed} com erro.` : `${saved.length} ${msg}`);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const openNew = () =>
    setEditing({
      category: category || '',
      status: 'active',
      isFeatured: false,
      image: '',
      gallery: [],
      specs: { operatingWeight: '', power: '', fuelType: '' },
      features: [],
      applications: [],
      safetyNotes: '',
      deliveryTime: 'Pronta entrega',
      summary: '',
      description: '',
    });

  const openDuplicate = (eq: Equipment) => {
    const { id: _id, slug: _slug, code: _code, ...rest } = eq;
    setEditing({ ...rest, name: `${eq.name} (cópia)`, status: 'draft', isFeatured: false, slug: '', code: '' });
  };

  const handleSaved = (saved: Equipment, isNew: boolean) => {
    onChange(isNew ? [saved, ...equipments] : equipments.map((eq) => (eq.id === saved.id ? saved : eq)));
    setEditing(null);
    showToast(isNew ? `"${saved.name}" cadastrado.` : `"${saved.name}" salvo.`);
  };

  const handleDelete = async (eq: Equipment) => {
    try {
      const res = await fetch(`/api/equipamentos/${eq.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Não foi possível excluir.');
      onChange(equipments.filter((e) => e.id !== eq.id));
      showToast(`"${eq.name}" excluído.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Não foi possível excluir.');
    } finally {
      setConfirmDelete(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setView('todos');
    setCategory('');
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Cabeçalho, como "Posts  [Adicionar novo]" no WordPress */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-slate-900">Produtos</h2>
        {isAdmin && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#C24E00] border border-[#FF6500] hover:bg-[#FF6500] hover:text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Adicionar novo
          </button>
        )}
        <button type="button" onClick={onManageCategories} className="ml-auto text-sm font-semibold text-slate-600 hover:text-[#FF6500] hover:underline">
          Categorias e subcategorias
        </button>
      </div>

      {/* Situação: Todos (n) | No site (n) | ... */}
      <nav aria-label="Filtrar por situação" className="flex flex-wrap items-center gap-x-1 text-sm text-slate-300">
        {(Object.keys(VIEW_LABELS) as ViewFilter[]).map((v, i) => {
          const n = equipments.filter((eq) => matchesView(eq, v)).length;
          if (v !== 'todos' && n === 0) return null;
          return (
            <React.Fragment key={v}>
              {i > 0 && <span aria-hidden="true">|</span>}
              <button
                type="button"
                aria-current={view === v ? 'true' : undefined}
                onClick={() => setView(v)}
                className={`px-1 ${view === v ? 'font-bold text-slate-900' : 'text-[#C24E00] hover:underline'} ${
                  v === 'incompletos' && view !== v ? 'text-amber-700' : ''
                }`}
              >
                {VIEW_LABELS[v]} <span className="font-normal text-slate-500">({n})</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="catalogo-categoria" className="sr-only">
          Filtrar por categoria
        </label>
        <select
          id="catalogo-categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-72 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
        >
          <option value="">Todas as categorias</option>
          <CategoryOptions categories={categories} />
          {orphanCategories.length > 0 && (
            <optgroup label="Sem cadastro">
              {orphanCategories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto pelo nome ou código"
            aria-label="Buscar produto"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
          />
        </div>
      </div>

      {/* Ações em lote */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 p-3 bg-slate-900 text-white rounded-xl shadow-lg">
          <span className="text-xs font-semibold mr-1">{selected.size} selecionado(s)</span>
          <select
            aria-label="Mover selecionados para a categoria"
            value=""
            disabled={busy === 'bulk'}
            onChange={(e) => e.target.value && bulkUpdate({ category: e.target.value }, 'movido(s) de categoria.')}
            className="px-2 py-1.5 text-xs text-slate-900 bg-white rounded-lg"
          >
            <option value="">Mover para a categoria...</option>
            <CategoryOptions categories={categories} />
          </select>
          <BulkButton disabled={busy === 'bulk'} onClick={() => bulkUpdate({ status: 'active' }, 'publicado(s) no site.')}>
            Mostrar no site
          </BulkButton>
          <BulkButton disabled={busy === 'bulk'} onClick={() => bulkUpdate({ status: 'draft' }, 'tirado(s) do site.')}>
            Tirar do site
          </BulkButton>
          <BulkButton disabled={busy === 'bulk'} onClick={() => bulkUpdate({ isFeatured: true }, 'marcado(s) como destaque.')}>
            Destacar
          </BulkButton>
          <BulkButton disabled={busy === 'bulk'} onClick={() => bulkUpdate({ isFeatured: false }, 'sem destaque.')}>
            Tirar destaque
          </BulkButton>
          {busy === 'bulk' && <Loader2 className="w-4 h-4 animate-spin" aria-label="Salvando" />}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto px-2 py-1.5 text-xs text-slate-300 hover:text-white">
            Limpar seleção
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600">Nenhum produto com esses filtros.</p>
            <button type="button" onClick={clearFilters} className="text-sm font-semibold text-[#C24E00] hover:underline">
              Mostrar todos
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-200">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos da lista"
                    checked={allVisibleSelected}
                    onChange={() => {
                      const next = new Set(selected);
                      filtered.forEach((eq) => (allVisibleSelected ? next.delete(eq.id) : next.add(eq.id)));
                      setSelected(next);
                    }}
                    className="w-4 h-4 rounded text-[#FF6500] focus:ring-[#FF6500]"
                  />
                </th>
                <th className="px-2 py-2.5">
                  Produto <span className="font-normal text-slate-400">({filtered.length})</span>
                </th>
                <th className="hidden md:table-cell px-2 py-2.5">Categoria</th>
                <th className="hidden sm:table-cell px-2 py-2.5">No site</th>
                <th className="hidden sm:table-cell w-14 px-2 py-2.5 text-center">
                  <Star className="inline w-4 h-4" aria-label="Destaque" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((eq) => {
                const issues = equipmentIssues(eq);
                const active = eq.status === 'active';
                return (
                  <tr key={eq.id} className={`align-top ${selected.has(eq.id) ? 'bg-orange-50/60' : 'hover:bg-slate-50'}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${eq.name}`}
                        checked={selected.has(eq.id)}
                        onChange={() => toggleSelect(eq.id)}
                        className="w-4 h-4 rounded text-[#FF6500] focus:ring-[#FF6500]"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setEditing(eq)}
                          className="relative w-16 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center"
                          aria-label={`Editar ${eq.name}`}
                        >
                          {isPlaceholderImage(eq.image) ? (
                            <ImageOff className="w-5 h-5 text-slate-400" aria-hidden="true" />
                          ) : (
                            <Image src={eq.image} alt="" fill unoptimized sizes="64px" className="object-cover" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setEditing(eq)}
                            className="text-left font-semibold text-slate-900 hover:text-[#C24E00]"
                          >
                            {eq.name}
                          </button>
                          {!active && <span className="ml-1.5 text-xs font-semibold text-slate-500">— Rascunho</span>}
                          <p className="md:hidden text-xs text-slate-500">{categoryLabel(eq.category, categories)}</p>
                          {issues.length > 0 && (
                            <p className="mt-1 flex flex-wrap gap-1">
                              {issues.map((i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded"
                                >
                                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                  {i}
                                </span>
                              ))}
                            </p>
                          )}
                          {/* Ações embaixo do nome, como no WordPress */}
                          <div className="mt-1 flex flex-wrap gap-x-1 text-xs text-slate-300">
                            <RowAction onClick={() => setEditing(eq)}>Editar</RowAction>
                            {isAdmin && (
                              <>
                                |<RowAction onClick={() => openDuplicate(eq)}>Duplicar</RowAction>
                              </>
                            )}
                            {active && (
                              <>
                                |
                                <a
                                  href={equipmentPath(eq)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-0.5 font-semibold text-slate-600 hover:text-[#C24E00] hover:underline"
                                >
                                  Ver no site
                                </a>
                              </>
                            )}
                            {isAdmin && (
                              <>
                                |<RowAction danger onClick={() => setConfirmDelete(eq)}>Excluir</RowAction>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-2 py-3">
                      <button
                        type="button"
                        onClick={() => setCategory(eq.category)}
                        title="Mostrar só esta categoria"
                        className="text-left text-xs text-[#C24E00] hover:underline"
                      >
                        {categoryLabel(eq.category, categories)}
                      </button>
                    </td>
                    <td className="hidden sm:table-cell px-2 py-3">
                      <Switch
                        checked={active}
                        disabled={busy === eq.id}
                        label={active ? 'Sim' : 'Não'}
                        onChange={() =>
                          quickUpdate(eq, { status: active ? 'draft' : 'active' }, active ? `"${eq.name}" saiu do site.` : `"${eq.name}" está no site.`)
                        }
                      />
                    </td>
                    <td className="hidden sm:table-cell px-2 py-3 text-center">
                      <button
                        type="button"
                        disabled={busy === eq.id}
                        onClick={() =>
                          quickUpdate(eq, { isFeatured: !eq.isFeatured }, eq.isFeatured ? 'Destaque removido.' : 'Marcado como destaque na página inicial.')
                        }
                        aria-pressed={eq.isFeatured}
                        title={eq.isFeatured ? 'Destaque na página inicial (clique para tirar)' : 'Destacar na página inicial'}
                        aria-label={`Destaque: ${eq.name}`}
                        className={`p-1.5 rounded-lg ${eq.isFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                      >
                        <Star className={`w-4 h-4 ${eq.isFeatured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <EquipmentEditor
          initial={editing}
          categories={categories}
          onCategoriesChange={onCategoriesChange}
          canCreateCategory={isAdmin}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="excluir-equip-titulo"
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-xl shadow-xl p-5 space-y-4">
            <h3 id="excluir-equip-titulo" className="text-sm font-bold text-slate-900">
              Excluir &quot;{confirmDelete.name}&quot;?
            </h3>
            <p className="text-xs text-slate-600">
              O item sai do catálogo e a página dele deixa de existir. Para só esconder do site, use &quot;Tirar do site&quot;.
            </p>
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
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Editor completo (como a tela de editar post do WordPress) ---------- */

type ExtraRow = { key: string; value: string };

interface EquipmentEditorProps {
  initial: Partial<Equipment>;
  categories: CategoryWithCount[];
  onCategoriesChange: (list: CategoryWithCount[]) => void;
  canCreateCategory: boolean;
  onClose: () => void;
  onSaved: (saved: Equipment, isNew: boolean) => void;
}

function EquipmentEditor({ initial, categories, onCategoriesChange, canCreateCategory, onClose, onSaved }: EquipmentEditorProps) {
  const isNew = !initial.id;
  const [draft, setDraft] = useState<Partial<Equipment>>(initial);
  const [photos, setPhotos] = useState<string[]>(() =>
    Array.from(new Set([initial.image, ...(initial.gallery || [])].filter((p): p is string => !!p && !isPlaceholderImage(p))))
  );
  const [main, setMain] = useState<string>(isPlaceholderImage(initial.image) ? '' : initial.image || '');
  const [extras, setExtras] = useState<ExtraRow[]>(() =>
    Object.entries(initial.specs?.additional || {}).map(([key, value]) => ({ key, value }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState(false);
  const [initialSnapshot] = useState(() => JSON.stringify({ draft: initial, photos, main, extras }));

  const dirty = JSON.stringify({ draft, photos, main, extras }) !== initialSnapshot;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const requestClose = () => {
    if (saving) return;
    if (dirty && !window.confirm('Sair sem salvar? As alterações feitas serão perdidas.')) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const set = <K extends keyof Equipment>(key: K, value: Equipment[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setSpec = (key: keyof TechnicalSpecs, value: string) =>
    setDraft((d) => ({ ...d, specs: { ...(d.specs as TechnicalSpecs), [key]: value } }));

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!draft.name?.trim()) return setError('Escreva o nome do produto.');
    if (!draft.category) return setError('Marque uma categoria na caixa "Categoria".');
    setSaving(true);
    setError(null);

    const mainPhoto = main && photos.includes(main) ? main : photos[0] || '';
    const categoryImage = categories.find((c) => c.name === draft.category)?.image;
    const image = mainPhoto || (initial.image && isPlaceholderImage(initial.image) ? initial.image : '') || categoryImage || FALLBACK_IMAGE;
    const gallery = mainPhoto ? [mainPhoto, ...photos.filter((p) => p !== mainPhoto)] : [];
    const additional: Record<string, string> = {};
    extras.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) additional[key.trim()] = value.trim();
    });

    const payload: Partial<Equipment> = {
      ...draft,
      name: draft.name.trim(),
      image,
      gallery,
      specs: {
        operatingWeight: '',
        power: '',
        fuelType: '',
        ...(draft.specs || {}),
        additional,
      } as TechnicalSpecs,
      features: (draft.features || []).map((f) => f.trim()).filter(Boolean),
      applications: (draft.applications || []).map((f) => f.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(isNew ? '/api/equipamentos' : `/api/equipamentos/${initial.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar.');
      onSaved(data as Equipment, isNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  };

  const issues = equipmentIssues({ ...draft, image: main || photos[0] || '' });
  const summaryLen = (draft.summary || '').length;
  const previewSlug = draft.slug || (draft.name ? slugify(draft.name) : '');
  const saveLabel = isNew ? (draft.status === 'active' ? 'Publicar' : 'Salvar rascunho') : 'Atualizar';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="editor-titulo" className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      {/* Barra do topo */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={requestClose}
          className="inline-flex items-center gap-1 p-2 -ml-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">Voltar à lista</span>
        </button>
        <div className="min-w-0 flex-1">
          <h2 id="editor-titulo" className="text-base font-bold text-slate-900 truncate">
            {isNew ? 'Adicionar novo produto' : 'Editar produto'}
          </h2>
          <p className="text-xs text-slate-500">{dirty ? 'Alterações não salvas' : isNew ? 'Preencha e publique' : 'Tudo salvo'}</p>
        </div>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving || (!dirty && !isNew)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
          {saveLabel}
        </button>
      </header>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-5 items-start">
          {error && (
            <p role="alert" className="lg:col-span-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {error}
            </p>
          )}

          {/* Coluna principal: conteúdo */}
          <div className="space-y-5 min-w-0">
            <div>
              <label htmlFor="eq-nome" className="sr-only">
                Nome do produto
              </label>
              <input
                id="eq-nome"
                required
                autoFocus={isNew}
                value={draft.name || ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Nome do produto (ex.: Betoneira 400 litros)"
                className="w-full px-4 py-3 text-xl font-semibold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent"
              />
              {/* Link permanente, como embaixo do título no WordPress */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                <span>Link:</span>
                {editSlug ? (
                  <>
                    <span className="font-mono">/locacao/.../</span>
                    <input
                      aria-label="Endereço da página"
                      value={draft.slug || ''}
                      onChange={(e) => set('slug', e.target.value)}
                      placeholder={previewSlug || 'aluguel-betoneira-400-litros'}
                      className="w-72 max-w-full px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                    />
                    <button type="button" onClick={() => setEditSlug(false)} className="font-semibold text-[#C24E00] hover:underline">
                      OK
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-slate-600 break-all">
                      /locacao/{draft.category ? slugify(draft.category) : '...'}/{previewSlug || '...'}
                    </span>
                    <button type="button" onClick={() => setEditSlug(true)} className="font-semibold text-[#C24E00] hover:underline">
                      Editar
                    </button>
                  </>
                )}
              </div>
              {!isNew && draft.slug !== initial.slug && (
                <p className="mt-1 text-[11px] text-amber-700">Mudar o link quebra os endereços já compartilhados.</p>
              )}
            </div>

            <Panel title="Fotos" hint="Arraste várias de uma vez. A foto com a estrela é a principal: aparece nos cards e no topo da página.">
              <PhotoManager
                photos={photos}
                main={main}
                nameHint={draft.name}
                onChange={(p, m) => {
                  setPhotos(p);
                  setMain(m);
                }}
              />
            </Panel>

            <Panel title="Descrição" hint="Explique o que o produto faz, onde é usado e o que vem junto na locação.">
              <textarea
                aria-label="Descrição"
                rows={8}
                value={draft.description || ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Ex.: Betoneira de 400 litros, ideal para concretagem de lajes e pisos..."
                className={inputCls}
              />
            </Panel>

            <Panel title="Resumo" hint="Uma frase curta que aparece no card do produto e no Google.">
              <textarea
                aria-label="Resumo"
                rows={2}
                maxLength={200}
                value={draft.summary || ''}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="Ex.: Betoneira 400 L com motor elétrico 2 CV, para obras de médio porte."
                className={inputCls}
              />
              <p className={`text-[11px] text-right ${summaryLen > 160 ? 'text-amber-700' : 'text-slate-400'}`}>{summaryLen}/160</p>
            </Panel>

            <Panel title="Ficha técnica" hint="Deixe em branco o que não se aplica.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Potência" htmlFor="eq-potencia">
                  <input id="eq-potencia" value={draft.specs?.power || ''} onChange={(e) => setSpec('power', e.target.value)} placeholder="Ex.: 5,5 HP" className={inputCls} />
                </Field>
                <Field label="Peso" htmlFor="eq-peso">
                  <input id="eq-peso" value={draft.specs?.operatingWeight || ''} onChange={(e) => setSpec('operatingWeight', e.target.value)} placeholder="Ex.: 85 kg" className={inputCls} />
                </Field>
                <Field label="Alimentação / combustível" htmlFor="eq-combustivel">
                  <input
                    id="eq-combustivel"
                    list="combustiveis"
                    value={draft.specs?.fuelType || ''}
                    onChange={(e) => setSpec('fuelType', e.target.value)}
                    placeholder="Ex.: Elétrico 220 V"
                    className={inputCls}
                  />
                  <datalist id="combustiveis">
                    <option value="Diesel S10" />
                    <option value="Gasolina" />
                    <option value="Elétrico 127 V" />
                    <option value="Elétrico 220 V" />
                    <option value="Elétrico 380 V trifásico" />
                    <option value="Bateria" />
                  </datalist>
                </Field>
                <Field label="Dimensões" htmlFor="eq-dimensoes">
                  <input id="eq-dimensoes" value={draft.specs?.dimensions || ''} onChange={(e) => setSpec('dimensions', e.target.value)} placeholder="Ex.: 1,2 x 0,8 x 1,4 m" className={inputCls} />
                </Field>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-700 mb-2">Outras especificações</p>
                <ul className="space-y-2">
                  {extras.map((row, i) => (
                    <li key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        aria-label="Nome da especificação"
                        value={row.key}
                        onChange={(e) => setExtras(extras.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                        placeholder="Ex.: Capacidade do tambor"
                        className={inputCls}
                      />
                      <input
                        aria-label="Valor"
                        value={row.value}
                        onChange={(e) => setExtras(extras.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
                        placeholder="Ex.: 400 litros"
                        className={inputCls}
                      />
                      <IconButton label="Remover linha" danger onClick={() => setExtras(extras.filter((_, j) => j !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => setExtras([...extras, { key: '', value: '' }])}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Adicionar especificação
                </button>
              </div>
            </Panel>

            <Panel title="Diferenciais" hint="Um por linha. Aparecem como lista na página do produto.">
              <ListEditor
                items={draft.features || []}
                onChange={(v) => set('features', v)}
                placeholder="Ex.: Motor revisado em oficina própria"
                addLabel="Adicionar diferencial"
              />
            </Panel>

            <Panel title="Onde usar" hint="Tipos de obra ou serviço em que o produto é usado.">
              <ListEditor
                items={draft.applications || []}
                onChange={(v) => set('applications', v)}
                placeholder="Ex.: Concretagem de lajes"
                addLabel="Adicionar uso"
              />
            </Panel>

            <Panel title="Segurança e cuidados">
              <textarea
                aria-label="Segurança e cuidados"
                rows={3}
                value={draft.safetyNotes || ''}
                onChange={(e) => set('safetyNotes', e.target.value)}
                placeholder="Ex.: Use óculos de proteção, luvas e protetor auricular."
                className={inputCls}
              />
            </Panel>
          </div>

          {/* Coluna lateral: Publicar, Categoria, Checklist */}
          <aside className="space-y-5 lg:sticky lg:top-0">
            <SideBox title="Publicar">
              <fieldset className="space-y-1.5">
                <legend className="text-xs font-semibold text-slate-700 mb-1">Situação</legend>
                <RadioRow
                  name="eq-status"
                  checked={draft.status === 'active'}
                  onChange={() => set('status', 'active')}
                  label="Publicado no site"
                  hint="Os clientes veem"
                />
                <RadioRow
                  name="eq-status"
                  checked={draft.status !== 'active'}
                  onChange={() => set('status', 'draft')}
                  label="Rascunho"
                  hint="Só aparece aqui no painel"
                />
              </fieldset>
              <label className="mt-3 flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(draft.isFeatured)}
                  onChange={(e) => set('isFeatured', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#FF6500] focus:ring-[#FF6500]"
                />
                <span className="text-sm text-slate-800">
                  Destaque na página inicial
                  <span className="block text-xs text-slate-500">Aparece na vitrine de destaques.</span>
                </span>
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Disponibilidade" htmlFor="eq-prazo">
                  <input
                    id="eq-prazo"
                    list="prazos-sugeridos"
                    value={draft.deliveryTime || ''}
                    onChange={(e) => set('deliveryTime', e.target.value)}
                    placeholder="Pronta entrega"
                    className={inputCls}
                  />
                  <datalist id="prazos-sugeridos">
                    <option value="Pronta entrega" />
                    <option value="Entrega em 24 horas" />
                    <option value="Entrega em 48 horas" />
                    <option value="Sob consulta" />
                  </datalist>
                </Field>
                <Field label="Código" htmlFor="eq-codigo" hint={isNew ? 'Vazio: automático' : undefined}>
                  <input
                    id="eq-codigo"
                    value={draft.code || ''}
                    onChange={(e) => set('code', e.target.value)}
                    placeholder="EQ-BET-400"
                    className={`${inputCls} font-mono`}
                  />
                </Field>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                {!isNew && initial.status === 'active' && initial.slug ? (
                  <a
                    href={equipmentPath(initial as Equipment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#C24E00] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    Ver no site
                  </a>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {saveLabel}
                </button>
              </div>
            </SideBox>

            <SideBox title="Categoria">
              <CategoryPicker
                value={draft.category || ''}
                onChange={(name) => set('category', name)}
                categories={categories}
                onCategoriesChange={onCategoriesChange}
                canCreate={canCreateCategory}
              />
            </SideBox>

            <SideBox title="Para ficar completo">
              <ul className="space-y-1.5 text-xs">
                {[
                  ['Sem foto própria', 'Foto do produto'],
                  ['Sem resumo', 'Resumo'],
                  ['Descrição curta', 'Descrição com 80 letras ou mais'],
                ].map(([key, label]) => {
                  const ok = !issues.includes(key);
                  return (
                    <li key={key} className={`flex items-center gap-2 ${ok ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {ok ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <AlertTriangle className="w-4 h-4" aria-hidden="true" />}
                      {label}
                      <span className="sr-only">{ok ? '(feito)' : '(falta)'}</span>
                    </li>
                  );
                })}
              </ul>
            </SideBox>
          </aside>
        </div>
      </form>
    </div>
  );
}

/** Caixa "Categoria" do editor: lista em árvore com uma opção marcada e "+ Adicionar nova categoria". */
function CategoryPicker({
  value,
  onChange,
  categories,
  onCategoriesChange,
  canCreate,
}: {
  value: string;
  onChange: (name: string) => void;
  categories: CategoryWithCount[];
  onCategoriesChange: (list: CategoryWithCount[]) => void;
  canCreate: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unknown = value && !categories.some((c) => c.name === value);

  const create = async () => {
    if (!newName.trim()) return setError('Escreva o nome da categoria.');
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), parentId: newParent, group: 'maquinas', description: '', image: '' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível criar a categoria.');
      const list = await fetch('/api/categorias').then((r) => r.json());
      onCategoriesChange(list.categories);
      onChange(data.name);
      setNewName('');
      setNewParent('');
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a categoria.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Categoria do produto" className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-3">
        {CATEGORY_GROUPS.map((g) => {
          const rows = categoryTree(categories, g);
          if (!rows.length) return null;
          return (
            <div key={g}>
              <p className="text-[11px] font-semibold text-slate-400 mb-1">{CATEGORY_GROUP_LABELS[g]}</p>
              <ul className="space-y-0.5">
                {rows.map(({ cat, depth }) => (
                  <li key={cat.id}>
                    <label
                      className={`flex items-center gap-2 py-1 pr-1 rounded cursor-pointer hover:bg-slate-50 text-sm ${depth ? 'pl-6' : 'pl-1'} ${
                        value === cat.name ? 'font-semibold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="eq-categoria"
                        checked={value === cat.name}
                        onChange={() => onChange(cat.name)}
                        className="text-[#FF6500] focus:ring-[#FF6500]"
                      />
                      {cat.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {unknown && (
          <label className="flex items-center gap-2 py-1 pl-1 text-sm text-amber-800">
            <input type="radio" name="eq-categoria" checked readOnly />
            {value} (sem cadastro)
          </label>
        )}
      </div>

      {canCreate &&
        (adding ? (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
            <label htmlFor="nova-cat-nome" className="block text-xs font-semibold text-slate-700">
              Nome da nova categoria
            </label>
            <input
              id="nova-cat-nome"
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  create();
                }
              }}
              className={inputCls}
            />
            <label htmlFor="nova-cat-pai" className="block text-xs font-semibold text-slate-700">
              Fica dentro de
            </label>
            <select id="nova-cat-pai" value={newParent} onChange={(e) => setNewParent(e.target.value)} className={`${inputCls} bg-white`}>
              <option value="">Nenhuma: é uma categoria principal</option>
              {CATEGORY_GROUPS.map((g) => {
                const tops = categoryTree(categories, g).filter((r) => r.depth === 0);
                if (!tops.length) return null;
                return (
                  <optgroup key={g} label={CATEGORY_GROUP_LABELS[g]}>
                    {tops.map(({ cat }) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {error && (
              <p role="alert" className="text-xs text-rose-700">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={create}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:border-slate-500 rounded-lg disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
                Adicionar categoria
              </button>
              <button type="button" onClick={() => setAdding(false)} className="px-2 text-xs text-slate-500 hover:text-slate-900">
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#C24E00] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Adicionar nova categoria
          </button>
        ))}
    </div>
  );
}

function SideBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs">
      <h3 className="px-4 py-2.5 text-sm font-bold text-slate-900 border-b border-slate-200">{title}</h3>
      <div className="p-4">{children}</div>
    </section>
  );
}

function RadioRow({ name, checked, onChange, label, hint }: { name: string; checked: boolean; onChange: () => void; label: string; hint: string }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 text-[#FF6500] focus:ring-[#FF6500]" />
      <span className="text-sm text-slate-800">
        {label}
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

function RowAction({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-0.5 font-semibold hover:underline ${danger ? 'text-rose-600 hover:text-rose-800' : 'text-slate-600 hover:text-[#C24E00]'}`}
    >
      {children}
    </button>
  );
}

/* ---------- Peças pequenas ---------- */

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent';

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}


function Switch({ checked, disabled, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="inline-flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50"
    >
      <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
      <span className={`w-16 text-left text-xs font-semibold ${checked ? 'text-emerald-700' : 'text-slate-500'}`}>{label}</span>
    </button>
  );
}

function ListEditor({ items, onChange, placeholder, addLabel }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; addLabel: string }) {
  return (
    <div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <input
              aria-label={`Item ${i + 1}`}
              value={item}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onChange([...items.slice(0, i + 1), '', ...items.slice(i + 1)]);
                }
              }}
              placeholder={placeholder}
              className={inputCls}
            />
            <IconButton label="Remover" danger onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="w-4 h-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange([...items, ''])}
        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
        {addLabel}
      </button>
    </div>
  );
}

function IconButton({ label, danger, onClick, children }: { label: string; danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg shrink-0 ${danger ? 'text-slate-400 hover:text-rose-700 hover:bg-rose-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  );
}

function BulkButton({ disabled, onClick, children }: { disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg disabled:opacity-50"
    >
      {children}
    </button>
  );
}

