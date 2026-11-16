'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react';

/** Envia uma foto para o servidor e devolve o endereço dela (ou lança o erro em português). */
export async function uploadCatalogPhoto(file: File, nameHint?: string): Promise<string> {
  const form = new FormData();
  form.append('foto', file);
  if (nameHint) form.append('nome', nameHint);
  let res: Response;
  try {
    res = await fetch('/api/midia/catalogo', { method: 'POST', body: form });
  } catch {
    throw new Error('Sem conexão com o servidor. Tente novamente.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.src) throw new Error(data.error || `Não foi possível enviar "${file.name}".`);
  return data.src as string;
}

/** Fotos genéricas antigas do modelo do site: contam como "sem foto própria". */
export const isPlaceholderImage = (src?: string) => !src || src.startsWith('/images/cat_');

interface PhotoManagerProps {
  /** Fotos na ordem da galeria */
  photos: string[];
  /** Foto principal (aparece nos cards e no topo da página) */
  main: string;
  onChange: (photos: string[], main: string) => void;
  /** Nome do equipamento, usado para nomear os arquivos (bom para o Google) */
  nameHint?: string;
  /** Uma foto só (categorias) */
  single?: boolean;
  /** Orientação de tamanho mostrada acima da área de envio */
  guide?: string;
}

/** Os cards do site têm proporção 4:3: fotos nesse formato aparecem maiores e sem faixas. */
export const PHOTO_GUIDE_4x3 =
  'Tamanho ideal: 1200 × 900 pixels (deitada, proporção 4:3). Mínimo de 500 pixels de largura. Equipamento inteiro e centralizado, de preferência em fundo branco ou claro, sem textos ou marcas por cima.';

export function PhotoManager({ photos, main, onChange, nameHint, single = false, guide = PHOTO_GUIDE_4x3 }: PhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const list = photos.filter((p) => !isPlaceholderImage(p));
  const currentMain = list.includes(main) ? main : list[0] || '';

  const handleFiles = async (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
    if (!images.length) return;
    const queue = single ? images.slice(0, 1) : images;
    setErrors([]);
    setUploading({ done: 0, total: queue.length });
    const added: string[] = [];
    const failed: string[] = [];
    for (const file of queue) {
      try {
        added.push(await uploadCatalogPhoto(file, nameHint));
      } catch (e) {
        failed.push(e instanceof Error ? e.message : `Falha ao enviar "${file.name}".`);
      }
      setUploading((u) => (u ? { ...u, done: u.done + 1 } : u));
    }
    setUploading(null);
    setErrors(failed);
    if (!added.length) return;
    if (single) {
      onChange([added[0]], added[0]);
    } else {
      const next = [...list, ...added];
      onChange(next, currentMain || added[0]);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next, currentMain);
  };

  const remove = (src: string) => {
    const next = list.filter((p) => p !== src);
    onChange(next, src === currentMain ? next[0] || '' : currentMain);
  };

  return (
    <div className="space-y-3">
      {guide && (
        <p className="text-[11px] leading-relaxed text-slate-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <strong className="font-semibold text-slate-800">Foto no tamanho certo: </strong>
          {guide}
        </p>
      )}
      {list.length > 0 && (
        <ul className={single ? 'grid grid-cols-1' : 'grid grid-cols-2 sm:grid-cols-3 gap-3'}>
          {list.map((src, i) => {
            const isMain = src === currentMain;
            return (
              <li
                key={src}
                className={`group relative rounded-lg overflow-hidden border-2 bg-slate-100 ${
                  isMain ? 'border-[#FF6500]' : 'border-transparent'
                }`}
              >
                {/* Mesmo enquadramento do site: foto inteira num quadro 4:3 */}
                <div className="relative aspect-[4/3] bg-white">
                  <Image src={src} alt="" fill unoptimized sizes="240px" className="object-contain p-1" />
                </div>
                {isMain && !single && (
                  <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#FF6500] rounded">
                    <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                    Principal
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex gap-1">
                    {!single && !isMain && (
                      <button
                        type="button"
                        onClick={() => onChange(list, src)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-900 bg-white/95 hover:bg-white rounded"
                        title="Usar como foto principal"
                      >
                        <Star className="w-3 h-3" aria-hidden="true" />
                        Principal
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!single && (
                      <>
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          className="p-1 text-slate-900 bg-white/95 hover:bg-white rounded disabled:opacity-30"
                          aria-label="Mover para a esquerda"
                          title="Mover para a esquerda"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === list.length - 1}
                          className="p-1 text-slate-900 bg-white/95 hover:bg-white rounded disabled:opacity-30"
                          aria-label="Mover para a direita"
                          title="Mover para a direita"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(src)}
                      className="p-1 text-white bg-rose-600/90 hover:bg-rose-600 rounded"
                      aria-label="Remover foto"
                      title="Remover foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!uploading) handleFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 p-5 text-center border-2 border-dashed rounded-lg transition-colors ${
          dragOver ? 'border-[#FF6500] bg-orange-50' : 'border-slate-300 bg-slate-50'
        }`}
      >
        {uploading ? (
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Enviando {Math.min(uploading.done + 1, uploading.total)} de {uploading.total}...
          </p>
        ) : (
          <>
            {list.length === 0 ? (
              <ImagePlus className="w-7 h-7 text-slate-400" aria-hidden="true" />
            ) : null}
            <p className="text-xs text-slate-600">
              {single
                ? list.length
                  ? 'Arraste outra foto aqui para trocar'
                  : 'Arraste a foto aqui'
                : list.length
                  ? 'Arraste mais fotos aqui'
                  : 'Arraste as fotos aqui (pode ser várias de uma vez)'}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              {single ? (list.length ? 'Trocar foto' : 'Escolher foto') : 'Escolher fotos'}
            </button>
            <p className="text-[11px] text-slate-500">JPG, PNG ou WEBP, até 12 MB.</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={!single}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 space-y-0.5">
          {errors.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
