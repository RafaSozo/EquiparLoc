'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Copy,
  Edit,
  ExternalLink,
  ImageOff,
  Loader2,
  Plus,
  Save,
  Search,
  Star,
  Tags,
  Trash2,
  X,
} from 'lucide-react';
import type { CategoryGroup, CategoryWithCount, Equipment, TechnicalSpecs } from '@/lib/types';
import { CATEGORY_GROUP_LABELS } from '@/lib/types';
import { equipmentPath } from '@/lib/site';
import { PhotoManager, isPlaceholderImage } from './PhotoManager';

const FALLBACK_IMAGE = '/images/cat_escavadeira_1793461101073.jpg';

type ViewFilter = 'todos' | 'publicados' | 'rascunhos' | 'destaques' | 'incompletos';

const VIEW_LABELS: Record<ViewFilter, string> = {
  todos: 'Todos',
  publicados: 'No site',
  rascunhos: 'Rascunhos',
  destaques: 'Destaques',
  incompletos: 'Incompletos',
};

/** O que falta para o item ficar bom no site (e no Google). */
export function equipmentIssues(eq: Partial<Equipment>): string[] {
  const out: string[] = [];
  if (isPlaceholderImage(eq.image)) out.push('Sem foto própria');
  if (!eq.summary?.trim()) out.push('Sem resumo');
  if ((eq.description || '').trim().length < 80) out.push('Descrição curta');
  return out;
}

interface CatalogManagerProps {
  equipments: Equipment[];
  onChange: (list: Equipment[]) => void;
  categories: CategoryWithCount[];
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

export function CatalogManager({
  equipments,
  onChange,
  categories,
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

  const countByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    equipments.forEach((eq) => (acc[eq.category] = (acc[eq.category] || 0) + 1));
    return acc;
  }, [equipments]);

  const orphanCategories = Object.keys(countByCategory).filter((name) => !categories.some((c) => c.name === name));

  const filtered = equipments.filter((eq) => {
    if (category && eq.category !== category) return false;
    if (view === 'publicados' && eq.status !== 'active') return false;
    if (view === 'rascunhos' && eq.status === 'active') return false;
    if (view === 'destaques' && !eq.isFeatured) return false;
    if (view === 'incompletos' && equipmentIssues(eq).length === 0) return false;
    const term = search.trim().toLowerCase();
    if (term) {
      const hay = `${eq.name} ${eq.code} ${eq.category} ${eq.summary}`.toLowerCase();
      if (!term.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const incompleteCount = equipments.filter((eq) => equipmentIssues(eq).length > 0).length;
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
      category: category || categories[0]?.name || '',
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

  const groups: CategoryGroup[] = ['maquinas', 'ferramentas'];

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Catálogo</h2>
          <p className="text-xs text-slate-500">
            {equipments.length} itens · {equipments.filter((e) => e.status === 'active').length} no site
            {incompleteCount > 0 && (
              <>
                {' · '}
                <button type="button" onClick={() => setView('incompletos')} className="text-amber-700 font-semibold hover:underline">
                  {incompleteCount} para completar
                </button>
              </>
            )}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Novo equipamento
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[15rem_1fr] gap-5 items-start">
        {/* Categorias */}
        <aside className="bg-white border border-slate-200 rounded-xl shadow-xs lg:sticky lg:top-4">
          <div className="lg:hidden p-3">
            <label htmlFor="catalogo-categoria" className="block text-xs font-semibold text-slate-700 mb-1">
              Categoria
            </label>
            <select
              id="catalogo-categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              <option value="">Todas ({equipments.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({countByCategory[c.name] || 0})
                </option>
              ))}
            </select>
          </div>
          <nav aria-label="Filtrar por categoria" className="hidden lg:block p-2 max-h-[70vh] overflow-y-auto">
            <CategoryButton label="Todas" count={equipments.length} active={!category} onClick={() => setCategory('')} />
            {groups.map((g) => {
              const list = categories.filter((c) => c.group === g);
              if (!list.length) return null;
              return (
                <div key={g} className="mt-3">
                  <p className="px-2 pb-1 text-[11px] font-semibold text-slate-400">{CATEGORY_GROUP_LABELS[g]}</p>
                  {list.map((c) => (
                    <CategoryButton
                      key={c.id}
                      label={c.name}
                      count={countByCategory[c.name] || 0}
                      active={category === c.name}
                      onClick={() => setCategory(c.name)}
                    />
                  ))}
                </div>
              );
            })}
            {orphanCategories.length > 0 && (
              <div className="mt-3">
                <p className="px-2 pb-1 text-[11px] font-semibold text-amber-600">Sem cadastro</p>
                {orphanCategories.map((name) => (
                  <CategoryButton
                    key={name}
                    label={name}
                    count={countByCategory[name]}
                    active={category === name}
                    onClick={() => setCategory(name)}
                  />
                ))}
              </div>
            )}
          </nav>
          <div className="border-t border-slate-200 p-2">
            <button
              type="button"
              onClick={onManageCategories}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <Tags className="w-3.5 h-3.5" aria-hidden="true" />
              Editar categorias
            </button>
          </div>
        </aside>

        <div className="space-y-3 min-w-0">
          {/* Busca e filtros */}
          <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, código ou categoria"
                aria-label="Buscar no catálogo"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Mostrar">
              {(Object.keys(VIEW_LABELS) as ViewFilter[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                    view === v ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
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
                <option value="">Mover para categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <BulkButton disabled={busy === 'bulk'} onClick={() => bulkUpdate({ status: 'active' }, 'publicado(s) no site.')}>
                Publicar
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
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto px-2 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Limpar seleção
              </button>
            </div>
          )}

          {/* Lista */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
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
              <span>
                {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
                {category && <> em <strong className="text-slate-800">{category}</strong></>}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm text-slate-600">Nenhum item com esses filtros.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setView('todos');
                    setCategory('');
                  }}
                  className="text-xs font-semibold text-[#FF6500] hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((eq) => {
                  const issues = equipmentIssues(eq);
                  const active = eq.status === 'active';
                  return (
                    <li key={eq.id} className={`flex items-center gap-3 px-3 py-2.5 ${selected.has(eq.id) ? 'bg-orange-50/60' : 'hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${eq.name}`}
                        checked={selected.has(eq.id)}
                        onChange={() => toggleSelect(eq.id)}
                        className="w-4 h-4 rounded text-[#FF6500] focus:ring-[#FF6500] shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => setEditing(eq)}
                        className="relative w-20 h-14 rounded-md overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center"
                        aria-label={`Editar ${eq.name}`}
                      >
                        {isPlaceholderImage(eq.image) ? (
                          <ImageOff className="w-5 h-5 text-slate-400" aria-hidden="true" />
                        ) : (
                          <Image src={eq.image} alt="" fill unoptimized sizes="80px" className="object-cover" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => setEditing(eq)}
                          className="block text-left text-sm font-semibold text-slate-900 hover:text-[#FF6500] truncate max-w-full"
                        >
                          {eq.name}
                        </button>
                        <p className="text-xs text-slate-500 truncate">
                          <span className="font-mono">{eq.code}</span> · {eq.category}
                        </p>
                        {issues.length > 0 && (
                          <p className="mt-0.5 flex flex-wrap gap-1">
                            {issues.map((i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded">
                                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                {i}
                              </span>
                            ))}
                          </p>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        <Switch
                          checked={active}
                          disabled={busy === eq.id}
                          label={active ? 'No site' : 'Rascunho'}
                          onChange={() =>
                            quickUpdate(eq, { status: active ? 'draft' : 'active' }, active ? `"${eq.name}" saiu do site.` : `"${eq.name}" está no site.`)
                          }
                        />
                        <button
                          type="button"
                          disabled={busy === eq.id}
                          onClick={() =>
                            quickUpdate(eq, { isFeatured: !eq.isFeatured }, eq.isFeatured ? 'Destaque removido.' : 'Marcado como destaque na página inicial.')
                          }
                          aria-pressed={eq.isFeatured}
                          title={eq.isFeatured ? 'Destaque na página inicial (clique para tirar)' : 'Destacar na página inicial'}
                          aria-label={`Destaque: ${eq.name}`}
                          className={`p-2 rounded-lg ${eq.isFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                        >
                          <Star className={`w-4 h-4 ${eq.isFeatured ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditing(eq)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:border-slate-400 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5" aria-hidden="true" />
                          <span className="hidden md:inline">Editar</span>
                        </button>
                        {isAdmin && (
                          <IconButton label="Duplicar" onClick={() => openDuplicate(eq)}>
                            <Copy className="w-4 h-4" />
                          </IconButton>
                        )}
                        {active && (
                          <a
                            href={equipmentPath(eq)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver no site"
                            aria-label={`Ver ${eq.name} no site`}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {isAdmin && (
                          <IconButton label="Excluir" danger onClick={() => setConfirmDelete(eq)}>
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <EquipmentEditor
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onManageCategories={() => {
            setEditing(null);
            onManageCategories();
          }}
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

/* ---------- Editor completo ---------- */

type ExtraRow = { key: string; value: string };

interface EquipmentEditorProps {
  initial: Partial<Equipment>;
  categories: CategoryWithCount[];
  onClose: () => void;
  onSaved: (saved: Equipment, isNew: boolean) => void;
  onManageCategories: () => void;
}

function EquipmentEditor({ initial, categories, onClose, onSaved, onManageCategories }: EquipmentEditorProps) {
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
    if (!draft.name?.trim()) return setError('Informe o nome do equipamento.');
    if (!draft.category) return setError('Escolha a categoria.');
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

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="editor-titulo" className="fixed inset-0 z-50 bg-slate-100 flex flex-col">
      {/* Barra do topo */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 bg-white border-b border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={requestClose}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Fechar editor"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 id="editor-titulo" className="text-base font-bold text-slate-900 truncate">
            {isNew ? 'Novo equipamento' : draft.name || 'Editar equipamento'}
          </h2>
          <p className="text-xs text-slate-500">{dirty ? 'Alterações não salvas' : isNew ? 'Preencha e salve' : 'Tudo salvo'}</p>
        </div>
        {!isNew && initial.status === 'active' && initial.slug && (
          <a
            href={equipmentPath(initial as Equipment)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            Ver no site
          </a>
        )}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving || (!dirty && !isNew)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
          {isNew ? 'Cadastrar' : 'Salvar'}
        </button>
      </header>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {error && (
            <p role="alert" className="lg:col-span-12 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {error}
            </p>
          )}

          {/* Coluna das fotos e situação */}
          <div className="lg:col-span-5 space-y-5">
            <Panel title="Fotos" hint="A foto com a estrela é a principal: aparece nos cards e no topo da página.">
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

            <Panel title="Situação">
              <div className="space-y-3">
                <ToggleRow
                  label="Mostrar no site"
                  hint={draft.status === 'active' ? 'Visível para os clientes.' : 'Rascunho: só aparece aqui no painel.'}
                  checked={draft.status === 'active'}
                  onChange={(v) => set('status', v ? 'active' : 'draft')}
                />
                <ToggleRow
                  label="Destaque na página inicial"
                  hint="Aparece na vitrine e no quadro do pátio."
                  checked={Boolean(draft.isFeatured)}
                  onChange={(v) => set('isFeatured', v)}
                />
                <Field label="Disponibilidade" htmlFor="eq-prazo">
                  <input
                    id="eq-prazo"
                    list="prazos-sugeridos"
                    value={draft.deliveryTime || ''}
                    onChange={(e) => set('deliveryTime', e.target.value)}
                    placeholder="Ex.: Pronta entrega"
                    className={inputCls}
                  />
                  <datalist id="prazos-sugeridos">
                    <option value="Pronta entrega" />
                    <option value="Entrega em 24 horas" />
                    <option value="Entrega em 48 horas" />
                    <option value="Sob consulta" />
                  </datalist>
                </Field>
              </div>
            </Panel>

            {issues.length > 0 && (
              <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="font-semibold mb-1">Para ficar completo:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {issues.map((i) => (
                    <li key={i}>{i === 'Descrição curta' ? 'Escreva uma descrição com pelo menos 80 letras' : i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Coluna dos textos */}
          <div className="lg:col-span-7 space-y-5">
            <Panel title="Informações">
              <div className="space-y-4">
                <Field label="Nome do equipamento *" htmlFor="eq-nome">
                  <input
                    id="eq-nome"
                    required
                    value={draft.name || ''}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Ex.: Betoneira 400 litros Menegotti"
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Categoria *" htmlFor="eq-categoria">
                    <select
                      id="eq-categoria"
                      value={draft.category || ''}
                      onChange={(e) => set('category', e.target.value)}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="" disabled>
                        Escolha...
                      </option>
                      {(['maquinas', 'ferramentas'] as CategoryGroup[]).map((g) => {
                        const list = categories.filter((c) => c.group === g);
                        if (!list.length) return null;
                        return (
                          <optgroup key={g} label={CATEGORY_GROUP_LABELS[g]}>
                            {list.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                      {draft.category && !categories.some((c) => c.name === draft.category) && (
                        <option value={draft.category}>{draft.category} (sem cadastro)</option>
                      )}
                    </select>
                    <button type="button" onClick={onManageCategories} className="mt-1 text-[11px] font-semibold text-[#FF6500] hover:underline">
                      Criar ou editar categorias
                    </button>
                  </Field>
                  <Field label="Código interno" htmlFor="eq-codigo" hint={isNew ? 'Em branco: o sistema cria.' : undefined}>
                    <input
                      id="eq-codigo"
                      value={draft.code || ''}
                      onChange={(e) => set('code', e.target.value)}
                      placeholder="Ex.: EQ-BET-400"
                      className={`${inputCls} font-mono`}
                    />
                  </Field>
                </div>
                <Field label="Resumo (aparece no card)" htmlFor="eq-resumo">
                  <textarea
                    id="eq-resumo"
                    rows={2}
                    maxLength={200}
                    value={draft.summary || ''}
                    onChange={(e) => set('summary', e.target.value)}
                    placeholder="Uma frase com o principal: capacidade, motor, para que serve."
                    className={inputCls}
                  />
                  <p className={`text-[11px] text-right ${summaryLen > 160 ? 'text-amber-700' : 'text-slate-400'}`}>{summaryLen}/160</p>
                </Field>
                <Field label="Descrição completa" htmlFor="eq-descricao">
                  <textarea
                    id="eq-descricao"
                    rows={6}
                    value={draft.description || ''}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Explique o que o equipamento faz, onde é usado e o que vem junto na locação."
                    className={inputCls}
                  />
                </Field>
              </div>
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

            <Panel title="Diferenciais" hint="Um por linha. Aparecem como lista na página do equipamento.">
              <ListEditor
                items={draft.features || []}
                onChange={(v) => set('features', v)}
                placeholder="Ex.: Motor revisado em oficina própria"
                addLabel="Adicionar diferencial"
              />
            </Panel>

            <Panel title="Onde usar" hint="Tipos de obra ou serviço em que o equipamento é usado.">
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

            <Panel title="Endereço da página" hint="Em branco, o sistema cria a partir do nome.">
              <div className="flex items-stretch">
                <span className="hidden sm:flex items-center px-3 text-xs text-slate-500 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg whitespace-nowrap">
                  /locacao/.../
                </span>
                <input
                  aria-label="Endereço da página"
                  value={draft.slug || ''}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="aluguel-betoneira-400-litros"
                  className={`${inputCls} sm:rounded-l-none font-mono`}
                />
              </div>
              {!isNew && draft.slug !== initial.slug && (
                <p className="mt-1 text-[11px] text-amber-700">
                  Mudar o endereço quebra links já compartilhados e o Google demora para atualizar.
                </p>
              )}
            </Panel>

            <div className="flex justify-end gap-2 pb-6">
              <button type="button" onClick={requestClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                {isNew ? 'Cadastrar equipamento' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
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

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-0.5 w-10 h-6 shrink-0 rounded-full bg-slate-300 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF6500] transition-colors after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
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

function CategoryButton({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left text-xs rounded-md ${
        active ? 'bg-[#FF6500] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span className="truncate">{label}</span>
      <span className={`shrink-0 tabular-nums ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>
    </button>
  );
}
