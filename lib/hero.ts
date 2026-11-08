import fs from 'fs';
import path from 'path';
import type { HeroSettings } from './types';
import { DATA_DIR } from './data-dir';

/** Textos e foto padrão da abertura (usados até alguém salvar pelo painel). */
export const DEFAULT_HERO: HeroSettings = {
  eyebrow: 'Locação de máquinas e ferramentas para obra',
  title: 'A força que move a sua obra.',
  text: 'Compactadores, betoneiras, martelos demolidores, geradores, miniescavadeiras e ferramentas revisados em oficina própria, com suporte técnico no canteiro.',
  image: '/images/hero/hero-obra-escavadeira-betoneira.jpg',
  imageAlt: 'Canteiro de obras com escavadeira, betoneira e gerador sob céu aberto',
  focus: 'center',
  primaryLabel: 'Pedir orçamento',
  secondaryLabel: 'Ver equipamentos',
  showBoard: true,
};

export const HERO_LIMITS = {
  eyebrow: 80,
  title: 90,
  text: 280,
  imageAlt: 160,
  label: 30,
};

/** Fotos que vêm com o site (pasta pública) */
const PUBLIC_HERO_DIR = path.join(process.cwd(), 'public', 'images', 'hero');
/** Fotos enviadas pelo painel (fora da pasta pública; servidas por /api/midia/hero) */
export const UPLOAD_HERO_DIR = path.join(DATA_DIR, 'uploads', 'hero');
export const UPLOAD_NAME_RE = /^[a-z0-9][a-z0-9-]{2,80}\.jpg$/;

export interface HeroImage {
  src: string;
  name: string;
  /** true = enviada pelo painel (pode ser apagada) */
  uploaded: boolean;
}

/** Lista as fotos disponíveis para a abertura. */
export function listHeroImages(): HeroImage[] {
  const list: HeroImage[] = [];
  try {
    for (const f of fs.readdirSync(PUBLIC_HERO_DIR).sort()) {
      if (/\.(jpe?g|png|webp)$/i.test(f)) list.push({ src: `/images/hero/${f}`, name: f, uploaded: false });
    }
  } catch {
    // pasta ainda não existe
  }
  try {
    const files = fs
      .readdirSync(UPLOAD_HERO_DIR)
      .filter((f) => UPLOAD_NAME_RE.test(f))
      .map((f) => ({ f, t: fs.statSync(path.join(UPLOAD_HERO_DIR, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const { f } of files) list.unshift({ src: `/api/midia/hero/${f}`, name: f, uploaded: true });
  } catch {
    // nenhuma foto enviada ainda
  }
  return list;
}

const clip = (v: unknown, max: number, fallback: string) =>
  typeof v === 'string' && v.trim() ? v.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max) : fallback;

/**
 * Valida o que veio do painel: corta os textos no limite e só aceita
 * uma foto que exista na lista de fotos da abertura.
 */
export function sanitizeHero(input: unknown, current: HeroSettings): HeroSettings {
  const b = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const images = listHeroImages().map((i) => i.src);
  const image = typeof b.image === 'string' && images.includes(b.image) ? b.image : current.image;
  return {
    eyebrow: clip(b.eyebrow, HERO_LIMITS.eyebrow, current.eyebrow),
    title: clip(b.title, HERO_LIMITS.title, current.title),
    text: clip(b.text, HERO_LIMITS.text, current.text),
    image,
    imageAlt: clip(b.imageAlt, HERO_LIMITS.imageAlt, current.imageAlt),
    focus: b.focus === 'left' || b.focus === 'right' || b.focus === 'center' ? b.focus : current.focus,
    primaryLabel: clip(b.primaryLabel, HERO_LIMITS.label, current.primaryLabel),
    secondaryLabel: clip(b.secondaryLabel, HERO_LIMITS.label, current.secondaryLabel),
    showBoard: typeof b.showBoard === 'boolean' ? b.showBoard : current.showBoard,
  };
}
