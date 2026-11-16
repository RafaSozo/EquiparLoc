import type { SocialId, SocialLinks } from './types';

/** Redes sociais que o painel aceita, na ordem em que aparecem no site. */
export const SOCIAL_NETWORKS: { id: SocialId; label: string; placeholder: string; hosts: RegExp }[] = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/equiparloc', hosts: /(^|\.)instagram\.com$/ },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/equiparloc', hosts: /(^|\.)(facebook\.com|fb\.com)$/ },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/equiparloc', hosts: /(^|\.)linkedin\.com$/ },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@equiparloc', hosts: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@equiparloc', hosts: /(^|\.)tiktok\.com$/ },
  {
    id: 'google',
    label: 'Google (perfil da empresa)',
    placeholder: 'Link do perfil no Google Maps (g.page ou maps.app.goo.gl)',
    hosts: /(^|\.)(g\.page|google\.com|google\.com\.br|maps\.app\.goo\.gl|goo\.gl)$/,
  },
];

/**
 * Deixa o link pronto para usar: aceita "instagram.com/equiparloc" e completa com https://.
 * Devolve '' se não for um link válido da rede indicada.
 */
export function normalizeSocialUrl(id: SocialId, raw: string): string {
  const net = SOCIAL_NETWORKS.find((n) => n.id === id);
  const value = (raw || '').trim();
  if (!net || !value) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!net.hosts.test(url.hostname.toLowerCase())) return '';
    url.protocol = 'https:';
    return url.toString().slice(0, 300);
  } catch {
    return '';
  }
}

/** Limpa o que vem do painel: só redes conhecidas e links válidos. */
export function sanitizeSocialLinks(input: unknown): SocialLinks {
  const out: SocialLinks = {};
  if (!input || typeof input !== 'object') return out;
  for (const net of SOCIAL_NETWORKS) {
    const v = (input as Record<string, unknown>)[net.id];
    const url = typeof v === 'string' ? normalizeSocialUrl(net.id, v) : '';
    if (url) out[net.id] = url;
  }
  return out;
}

/** Perfis preenchidos, na ordem do site */
export function socialList(links?: SocialLinks): { id: SocialId; label: string; url: string }[] {
  return SOCIAL_NETWORKS.filter((n) => links?.[n.id]).map((n) => ({
    id: n.id,
    label: n.id === 'google' ? 'Google' : n.label,
    url: links![n.id] as string,
  }));
}
