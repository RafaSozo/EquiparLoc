import type { CompanySettings, PublicCompany } from './types';

/*
 * Dados da empresa usados pelo site inteiro (rodapé, topo, Contato, botões de WhatsApp...).
 * Vêm de Configurações no painel; estas funções só formatam. Funciona no servidor e no navegador.
 */

export const digits = (v: string) => (v || '').replace(/\D/g, '');

/** Só os campos que podem aparecer no site */
export function toPublicCompany(s: CompanySettings): PublicCompany {
  return {
    companyName: s.companyName,
    tradeName: s.tradeName,
    cnpj: s.cnpj,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    address: s.address,
    businessHours: s.businessHours,
  };
}

/** Número com DDI 55 (o painel aceita com ou sem) */
function withCountry(v: string): string {
  const d = digits(v);
  if (!d) return '';
  return d.length <= 11 ? `55${d}` : d;
}

/** Link tel: do telefone fixo */
export const telHref = (phone: string) => `tel:+${withCountry(phone)}`;

/** Link do WhatsApp, com mensagem opcional */
export function waHref(whatsapp: string, text?: string): string {
  const base = `https://wa.me/${withCountry(whatsapp)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** (31) 99197-0322 a partir de 5531991970322 */
export function formatPhone(v: string): string {
  let d = digits(v);
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

/** Endereço quebrado em linhas: "Rua, nº - Bairro, Cidade - UF, CEP x" */
export function addressLines(address: string): string[] {
  const a = (address || '').trim();
  const m = a.match(/^(.*?)\s+-\s+(.*?),\s*(.*?)(?:,\s*(CEP.*))?$/);
  if (!m) return a ? [a] : [];
  return [m[1], `${m[2]}, ${m[3]}`, m[4]].filter(Boolean) as string[];
}

/** Partes do endereço para o Google ("Rua, nº - Bairro, Cidade - UF, CEP 00000-000") */
export function parseAddress(address: string) {
  const a = (address || '').trim();
  const m = a.match(/^(.*?)\s+-\s+(.*?),\s*(.*?)\s*-\s*([A-Z]{2})\b(?:,?\s*CEP\s*([\d.-]+))?/);
  if (!m) return { street: a || undefined } as { street?: string; city?: string; state?: string; cep?: string };
  return { street: m[1], city: m[3], state: m[4], cep: m[5] };
}

/** "Segunda a Sexta: 08h às 17h" -> { opens: '08:00', closes: '17:00' } */
export function parseHours(hours: string): { opens: string; closes: string } | null {
  const m = (hours || '').match(/(\d{1,2})h(\d{2})?\s*(?:às|as|a|-)\s*(\d{1,2})h(\d{2})?/i);
  if (!m) return null;
  const t = (h: string, min?: string) => `${h.padStart(2, '0')}:${min || '00'}`;
  return { opens: t(m[1], m[2]), closes: t(m[3], m[4]) };
}

/** Horário em partes ("Segunda a Sexta: 08h às 17h | Emergência 24h") */
export const hoursParts = (hours: string) =>
  (hours || '').split('|').map((p) => p.trim()).filter(Boolean);

/** Campos que o painel pode alterar em Configurações */
export const EDITABLE_SETTINGS = [
  'companyName',
  'tradeName',
  'cnpj',
  'phone',
  'whatsapp',
  'email',
  'address',
  'businessHours',
  'gaMeasurementId',
] as const;
