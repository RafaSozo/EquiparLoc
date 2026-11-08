import { NextRequest, NextResponse } from 'next/server';

/*
 * Proteções para as rotas que visitantes podem usar sem login
 * (pedido de orçamento, comentários e contador de visualizações).
 *
 * - Limite de envios por IP numa janela de tempo (em memória: reinicia com o servidor,
 *   o que é suficiente para barrar robôs e repetições acidentais).
 * - Limite de tamanho da requisição e de cada campo, porque o banco é um único
 *   arquivo regravado a cada envio.
 */

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

/**
 * IP do visitante.
 * - x-real-ip: definido pelo proxy da hospedagem (nginx etc.) com o IP real.
 * - x-forwarded-for: usa o ÚLTIMO item, que é o que o proxy acrescentou. O primeiro
 *   item pode ser inventado pelo próprio visitante para escapar do limite.
 */
export function clientIp(req: NextRequest): string {
  // Em produção, defina TRUSTED_IP_HEADER com o cabeçalho que SÓ a hospedagem preenche
  // (Cloudflare: cf-connecting-ip; Vercel: x-real-ip). Assim o visitante não consegue
  // inventar um IP novo a cada envio para escapar do limite.
  const trusted = process.env.TRUSTED_IP_HEADER?.trim();
  if (trusted) return req.headers.get(trusted)?.split(',')[0].trim() || 'desconhecido';
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return 'desconhecido';
}

/**
 * Registra uma tentativa e informa se passou do limite.
 * Ex.: hitLimit(`orcamento:${ip}`, 5, 10 * 60_000) -> até 5 envios a cada 10 minutos.
 */
export function hitLimit(key: string, max: number, windowMs: number): { limited: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Limpeza periódica para o mapa não crescer sem fim
  if (now - lastSweep > 10 * 60_000) {
    for (const [k, times] of buckets) {
      if (!times.length || now - times[times.length - 1] > 24 * 60 * 60_000) buckets.delete(k);
    }
    lastSweep = now;
  }

  const recent = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return { limited: true, retryAfterSec: Math.ceil((windowMs - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  buckets.set(key, recent);
  return { limited: false, retryAfterSec: 0 };
}

export function tooManyRequests(message: string, retryAfterSec: number) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, retryAfterSec)) } }
  );
}

/**
 * Lê o corpo JSON recusando requisições grandes demais.
 * Retorna { body } ou { error } (resposta pronta para devolver).
 */
export async function readJsonLimited<T = Record<string, unknown>>(
  req: NextRequest,
  maxBytes: number
): Promise<{ body: T; error?: undefined } | { body?: undefined; error: NextResponse }> {
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared > maxBytes) {
    return { error: NextResponse.json({ error: 'Conteúdo grande demais. Encurte o texto e tente de novo.' }, { status: 413 }) };
  }
  const text = await req.text();
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    return { error: NextResponse.json({ error: 'Conteúdo grande demais. Encurte o texto e tente de novo.' }, { status: 413 }) };
  }
  try {
    return { body: JSON.parse(text || '{}') as T };
  } catch {
    return { error: NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 }) };
  }
}

/** Texto limpo: remove espaços nas pontas e caracteres de controle; corta no limite. */
export function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

/** Verifica se o texto original passou do limite (para avisar em vez de cortar em silêncio). */
export function tooLong(value: unknown, maxLength: number): boolean {
  return typeof value === 'string' && value.trim().length > maxLength;
}

export { EMAIL_RE, FIELD_LIMITS } from './form-limits';
