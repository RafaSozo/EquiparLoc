'use client';

import React, { useState } from 'react';
import { ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import type { AboutCard, AboutPageContent } from '@/lib/types';
import { PhotoManager } from './PhotoManager';

interface AboutManagerProps {
  initial: AboutPageContent;
  showToast: (msg: string) => void;
}

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500] focus:outline-none';

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  rows,
  max,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  max: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      {rows ? (
        <textarea id={id} rows={rows} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : (
        <input id={id} type="text" maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
      {hint && <p className="text-[11px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

function CardsEditor({
  id,
  items,
  onChange,
  max,
  addLabel,
}: {
  id: string;
  items: AboutCard[];
  onChange: (items: AboutCard[]) => void;
  max: number;
  addLabel: string;
}) {
  const set = (i: number, patch: Partial<AboutCard>) => onChange(items.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="space-y-3">
      {items.map((c, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[14rem_1fr_auto] gap-2 items-start p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <input
            aria-label={`Título ${i + 1}`}
            type="text"
            maxLength={160}
            value={c.title}
            onChange={(e) => set(i, { title: e.target.value })}
            placeholder="Título"
            className={inputCls}
          />
          <textarea
            aria-label={`Texto ${i + 1}`}
            rows={2}
            maxLength={600}
            value={c.text}
            onChange={(e) => set(i, { text: e.target.value })}
            placeholder="Texto"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            aria-label={`Remover item ${i + 1}`}
            className="p-2 text-red-700 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          id={id}
          onClick={() => onChange([...items, { title: '', text: '' }])}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C24D00] hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Edição dos textos e da foto da página Empresa. */
export function AboutManager({ initial, showToast }: AboutManagerProps) {
  const [about, setAbout] = useState<AboutPageContent>(initial);
  const [saved, setSaved] = useState<AboutPageContent>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(about) !== JSON.stringify(saved);

  const set = <K extends keyof AboutPageContent>(key: K, value: AboutPageContent[K]) => setAbout((a) => ({ ...a, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(about),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Não foi possível salvar a página Empresa.');
        return;
      }
      setAbout(data);
      setSaved(data);
      showToast('Página Empresa atualizada no site.');
    } catch {
      showToast('Sem conexão com o servidor. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Página Empresa</h2>
          <p className="text-xs text-slate-500">Os textos e a foto da página “Empresa” do site. As mudanças entram no ar ao salvar.</p>
        </div>
        <a
          href="/empresa"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Ver página no site
        </a>
      </div>

      <Section title="Topo da página">
        <Field id="emp-hero-title" label="Título" value={about.heroTitle} onChange={(v) => set('heroTitle', v)} max={160} />
        <Field id="emp-hero-text" label="Texto de apresentação" value={about.heroText} onChange={(v) => set('heroText', v)} rows={3} max={600} />
      </Section>

      <Section title="Quem somos" hint="O bloco com a foto ao lado.">
        <Field id="emp-sec-title" label="Título" value={about.sectionTitle} onChange={(v) => set('sectionTitle', v)} max={160} />
        <Field
          id="emp-sec-text"
          label="Texto"
          hint="Deixe uma linha em branco entre os parágrafos."
          value={about.sectionText}
          onChange={(v) => set('sectionText', v)}
          rows={7}
          max={3000}
        />
        <div>
          <p className="block text-xs font-semibold text-slate-700 mb-1">Foto</p>
          <PhotoManager
            single
            photos={about.image ? [about.image] : []}
            main={about.image}
            onChange={(photos, main) => set('image', main || photos[0] || '')}
            nameHint="empresa"
          />
        </div>
        <Field
          id="emp-img-alt"
          label="Descrição da foto"
          hint="O que aparece na foto, para quem usa leitor de tela e para o Google."
          value={about.imageAlt}
          onChange={(v) => set('imageAlt', v)}
          max={160}
        />
        <div>
          <p className="block text-xs font-semibold text-slate-700 mb-2">Destaques abaixo do texto (até 4)</p>
          <CardsEditor id="emp-add-card" items={about.cards} onChange={(v) => set('cards', v)} max={4} addLabel="Adicionar destaque" />
        </div>
      </Section>

      <Section title="Diretrizes" hint="A faixa com os cartões de compromissos da empresa.">
        <Field id="emp-pil-title" label="Título" value={about.pillarsTitle} onChange={(v) => set('pillarsTitle', v)} max={160} />
        <Field id="emp-pil-text" label="Subtítulo" value={about.pillarsText} onChange={(v) => set('pillarsText', v)} rows={2} max={600} />
        <CardsEditor id="emp-add-pillar" items={about.pillars} onChange={(v) => set('pillars', v)} max={6} addLabel="Adicionar diretriz" />
      </Section>

      <Section title="Chamada no fim da página">
        <Field id="emp-cta-title" label="Título" value={about.ctaTitle} onChange={(v) => set('ctaTitle', v)} max={160} />
        <Field id="emp-cta-text" label="Texto" value={about.ctaText} onChange={(v) => set('ctaText', v)} rows={2} max={600} />
      </Section>

      <div className="sticky bottom-0 bg-slate-50/95 py-3 flex items-center justify-end gap-3 border-t border-slate-200">
        {dirty && <span className="text-xs text-amber-700">Há mudanças não salvas.</span>}
        <button
          type="submit"
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Salvando...' : 'Salvar página Empresa'}
        </button>
      </div>
    </form>
  );
}
