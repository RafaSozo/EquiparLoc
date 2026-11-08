'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Save, Trash2, Loader2, Check, ExternalLink } from 'lucide-react';
import type { HeroSettings } from '@/lib/types';

/*
 * Módulo "Abertura do site": edita a foto e os textos do hero da página inicial.
 * Só o administrador vê esta aba (a API também recusa outros perfis).
 */

interface HeroImage {
  src: string;
  name: string;
  uploaded: boolean;
}

const LIMITS = { eyebrow: 80, title: 90, text: 280, imageAlt: 160, label: 30 };

const FOCUS_OPTIONS: { value: HeroSettings['focus']; label: string }[] = [
  { value: 'left', label: 'Esquerda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Direita' },
];
const FOCUS_POS: Record<HeroSettings['focus'], string> = { left: '20% 50%', center: '50% 50%', right: '80% 50%' };

export function HeroManager({ showToast }: { showToast: (msg: string) => void }) {
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [saved, setSaved] = useState<HeroSettings | null>(null);
  const [images, setImages] = useState<HeroImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [h, i] = await Promise.all([fetch('/api/hero'), fetch('/api/hero/imagens')]);
        const heroData = await h.json();
        setHero(heroData);
        setSaved(heroData);
        if (i.ok) setImages((await i.json()).images || []);
        else setError((await i.json().catch(() => ({}))).error || 'Não foi possível carregar as fotos.');
      } catch {
        setError('Não foi possível carregar a abertura.');
      }
    })();
  }, []);

  if (!hero) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 p-6">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando a abertura do site...
      </div>
    );
  }

  const changed = JSON.stringify(hero) !== JSON.stringify(saved);
  const set = <K extends keyof HeroSettings>(key: K, value: HeroSettings[K]) => setHero({ ...hero, [key]: value });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hero),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar.');
      setHero(data);
      setSaved(data);
      showToast('Abertura do site atualizada!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('foto', file);
      const res = await fetch('/api/hero/imagens', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar a foto.');
      setImages((prev) => [data.image, ...prev]);
      set('image', data.image.src);
      showToast('Foto enviada. Confira e clique em Salvar.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (img: HeroImage) => {
    if (!confirm('Apagar esta foto? Esta ação não pode ser desfeita.')) return;
    setError(null);
    const res = await fetch(`/api/hero/imagens?nome=${encodeURIComponent(img.name)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Não foi possível apagar a foto.');
      return;
    }
    setImages((prev) => prev.filter((i) => i.src !== img.src));
    showToast('Foto apagada.');
  };

  const field = 'w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6500]';
  const counter = (v: string, max: number) => (
    <span className={`text-[11px] ${v.length > max * 0.9 ? 'text-[#B84700]' : 'text-slate-400'}`}>
      {v.length}/{max}
    </span>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Abertura do site</h2>
          <p className="text-sm text-slate-500">A foto e os textos que aparecem no topo da página inicial.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Ver no site
          </a>
          <button
            type="button"
            onClick={save}
            disabled={!changed || saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {changed ? 'Salvar alterações' : 'Salvo'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Prévia */}
      <div className="relative overflow-hidden rounded-lg bg-[#1B2228] aspect-[16/7] min-h-[220px]">
        <Image src={hero.image} alt="" fill sizes="(min-width: 1024px) 1100px, 100vw" className="object-cover" style={{ objectPosition: FOCUS_POS[hero.focus] }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,20,24,0.92)_0%,rgba(15,20,24,0.75)_40%,rgba(15,20,24,0.15)_85%)]" />
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-center max-w-[60%] min-w-[260px]">
          <span className="text-xs sm:text-sm font-semibold text-[#FFB27A]">{hero.eyebrow}</span>
          <span className="mt-2 text-2xl sm:text-4xl font-extrabold text-white leading-[0.95] [font-stretch:72%]">{hero.title}</span>
          <span className="mt-3 text-xs sm:text-sm text-[#D5DBE0] line-clamp-3">{hero.text}</span>
          <span className="mt-4 flex gap-2">
            <span className="px-3 py-1.5 text-xs font-bold bg-[#FF6500] text-[#1B2228] rounded">{hero.primaryLabel}</span>
            <span className="px-3 py-1.5 text-xs font-semibold text-white border border-white/80 rounded">{hero.secondaryLabel}</span>
          </span>
        </div>
        <span className="absolute top-3 right-3 px-2 py-1 text-[11px] font-semibold bg-white/90 text-slate-700 rounded">Prévia</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Textos */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Textos</h3>

          <label className="block">
            <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">Linha acima do título {counter(hero.eyebrow, LIMITS.eyebrow)}</span>
            <input className={field} maxLength={LIMITS.eyebrow} value={hero.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
          </label>

          <label className="block">
            <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">Título {counter(hero.title, LIMITS.title)}</span>
            <input className={field} maxLength={LIMITS.title} value={hero.title} onChange={(e) => set('title', e.target.value)} />
          </label>

          <label className="block">
            <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">Texto de apoio {counter(hero.text, LIMITS.text)}</span>
            <textarea className={field} rows={3} maxLength={LIMITS.text} value={hero.text} onChange={(e) => set('text', e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Botão laranja</span>
              <input className={field} maxLength={LIMITS.label} value={hero.primaryLabel} onChange={(e) => set('primaryLabel', e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Botão do catálogo</span>
              <input className={field} maxLength={LIMITS.label} value={hero.secondaryLabel} onChange={(e) => set('secondaryLabel', e.target.value)} />
            </label>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={hero.showBoard}
              onChange={(e) => set('showBoard', e.target.checked)}
              className="w-4 h-4 accent-[#FF6500]"
            />
            <span className="text-sm text-slate-700">Mostrar o quadro do pátio (com o botão para o cliente separar as datas)</span>
          </label>
        </div>

        {/* Foto */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Foto de fundo</h3>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Enviando...' : 'Enviar foto'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </div>
          <p className="text-xs text-slate-500">
            Use fotos deitadas (horizontais), com pelo menos 1.200 px de largura e até 8 MB. Fotos reais da frota e de obras atendidas passam mais confiança.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => {
              const selected = img.src === hero.image;
              return (
                <div key={img.src} className="relative group">
                  <button
                    type="button"
                    onClick={() => set('image', img.src)}
                    aria-pressed={selected}
                    aria-label={`Usar a foto ${img.name}`}
                    className={`relative block w-full aspect-[3/2] rounded-md overflow-hidden ring-2 ${selected ? 'ring-[#FF6500]' : 'ring-transparent hover:ring-slate-300'}`}
                  >
                    <Image src={img.src} alt="" fill sizes="160px" className="object-cover" />
                    {selected && (
                      <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-[#FF6500] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                  {img.uploaded && !selected && (
                    <button
                      type="button"
                      onClick={() => remove(img)}
                      aria-label={`Apagar a foto ${img.name}`}
                      className="absolute top-1 right-1 p-1 rounded bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-600 mb-1">Parte da foto que deve aparecer sempre</span>
            <div className="inline-flex rounded-md border border-slate-300 overflow-hidden">
              {FOCUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('focus', o.value)}
                  aria-pressed={hero.focus === o.value}
                  className={`px-3 py-1.5 text-xs font-semibold ${hero.focus === o.value ? 'bg-[#101820] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
              Descrição da foto (para Google e leitores de tela) {counter(hero.imageAlt, LIMITS.imageAlt)}
            </span>
            <input className={field} maxLength={LIMITS.imageAlt} value={hero.imageAlt} onChange={(e) => set('imageAlt', e.target.value)} />
          </label>
        </div>
      </div>
    </div>
  );
}
