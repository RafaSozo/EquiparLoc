import type { Equipment } from './types';

/*
 * Lista do que o painel pode gravar num equipamento.
 * Campos fora desta lista, ou com o tipo errado, são descartados
 * (evita que uma requisição altere o "id" ou injete dados inesperados no banco).
 */

const TEXT_MAX = 300;
const LONG_MAX = 8000;

const str = (v: unknown, max = TEXT_MAX) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const strList = (v: unknown, maxItems = 40) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, maxItems).map((x) => x.slice(0, TEXT_MAX)) : undefined;

/** Caminho de imagem aceito: arquivo do próprio site ou endereço https. */
const imageUrl = (v: unknown) => {
  const s = str(v, 500);
  if (s === undefined) return undefined;
  return s.startsWith('/') && !s.startsWith('//') ? s : /^https:\/\//i.test(s) ? s : undefined;
};

export function pickEquipmentFields(body: unknown): Partial<Equipment> {
  if (!body || typeof body !== 'object') return {};
  const b = body as Record<string, unknown>;
  const out: Partial<Equipment> = {};

  const code = str(b.code, 40);
  if (code !== undefined) out.code = code;
  const name = str(b.name, 200);
  if (name !== undefined) out.name = name;
  const slug = str(b.slug, 200);
  if (slug !== undefined) out.slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
  const category = str(b.category, 120);
  if (category !== undefined) out.category = category as Equipment['category'];
  const image = imageUrl(b.image);
  if (image !== undefined) out.image = image;
  if (Array.isArray(b.gallery)) out.gallery = b.gallery.map(imageUrl).filter((x): x is string => !!x).slice(0, 20);
  if (b.status === 'active' || b.status === 'draft') out.status = b.status;
  if (typeof b.isFeatured === 'boolean') out.isFeatured = b.isFeatured;
  const summary = str(b.summary, 600);
  if (summary !== undefined) out.summary = summary;
  const description = str(b.description, LONG_MAX);
  if (description !== undefined) out.description = description;
  const features = strList(b.features);
  if (features) out.features = features;
  const applications = strList(b.applications);
  if (applications) out.applications = applications;
  const safetyNotes = str(b.safetyNotes, 2000);
  if (safetyNotes !== undefined) out.safetyNotes = safetyNotes;
  const deliveryTime = str(b.deliveryTime, 120);
  if (deliveryTime !== undefined) out.deliveryTime = deliveryTime;

  // Ficha técnica: só valores de texto (inclui a tabela livre "extra")
  if (b.specs && typeof b.specs === 'object' && !Array.isArray(b.specs)) {
    const specs: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(b.specs as Record<string, unknown>).slice(0, 60)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (typeof v === 'string') specs[k] = v.slice(0, TEXT_MAX);
      else if (v && typeof v === 'object' && !Array.isArray(v)) {
        const inner: Record<string, string> = {};
        for (const [ik, iv] of Object.entries(v as Record<string, unknown>).slice(0, 60)) {
          if (typeof iv === 'string' && ik !== '__proto__') inner[ik.slice(0, 80)] = iv.slice(0, TEXT_MAX);
        }
        specs[k] = inner;
      }
    }
    out.specs = specs as unknown as Equipment['specs'];
  }

  return out;
}

/** Transforma um texto em endereço de página (sem acentos) e garante que nenhum outro equipamento use o mesmo. */
export function uniqueSlug(text: string, all: Pick<Equipment, 'id' | 'slug'>[], ownId?: string): string {
  const base =
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 120) || 'equipamento';
  const taken = new Set(all.filter((e) => e.id !== ownId).map((e) => e.slug));
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
