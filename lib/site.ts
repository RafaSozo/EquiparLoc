// Configurações globais de SEO do site (URL pública, nome e dados da empresa)

export const SITE_URL = (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')
  ? process.env.APP_URL
  : 'https://equiparloc.com.br'
).replace(/\/$/, '');

export const SITE_NAME = 'EquiparLoc';
export const SITE_LEGAL_NAME = 'EQUIPAR Locação de Equipamentos Ltda.';
export const DEFAULT_OG_IMAGE = '/images/hero/hero-obra-escavadeira-betoneira.jpg';

/** Converte um caminho relativo ("/locacao") em URL absoluta ("https://.../locacao"). */
export function absoluteUrl(path: string = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const PT_MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

/**
 * Lê datas no formato "28 de Outubro de 2026" (ou ISO) e devolve um Date.
 * Retorna undefined se não conseguir interpretar.
 */
export function parsePtBrDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(value)) return iso;

  const match = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/);
  if (!match) return undefined;
  const month = PT_MONTHS[match[2]];
  if (month === undefined) return undefined;
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1]), 12));
}

/**
 * JSON-LD seguro para <script>: troca "<" por < para que um texto com
 * "</script>" (título de produto, artigo etc.) não consiga fechar o bloco e injetar código.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\u003c');
}

/** Texto em formato de endereço: "Compactação de Solos" -> "compactacao-de-solos" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Página de um grupo de equipamentos: /locacao/compactacao-de-solos */
export function categoryPath(categoryName: string): string {
  return `/locacao/${slugify(categoryName)}`;
}

/** Página de um equipamento: /locacao/compactacao-de-solos/aluguel-placa-vibratoria-... */
export function equipmentPath(eq: { slug: string; category: string }): string {
  return `${categoryPath(eq.category)}/${eq.slug}`;
}
