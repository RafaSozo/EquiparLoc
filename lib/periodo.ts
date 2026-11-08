/*
 * Datas do período de locação (retirada e devolução), sempre no horário local
 * e no formato AAAA-MM-DD nos endereços (/orcamento?retirada=...&devolucao=...).
 */

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

/** Meia-noite local de uma data (sem horas, para comparar dias). */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Lê AAAA-MM-DD; devolve null se for inválida (ex.: 2026-02-31). */
export function fromIso(v: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d : null;
}

export function formatBr(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Dias de locação contando a retirada e a devolução. */
export function countDays(start: Date, end: Date): number {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000) + 1;
}

export function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

/** Texto do período para o pedido de orçamento: "10/11/2026 a 14/11/2026 (5 dias)" */
export function periodLabel(start: Date, end: Date): string {
  const n = countDays(start, end);
  return `${formatBr(start)} a ${formatBr(end)} (${n} ${n === 1 ? 'dia' : 'dias'})`;
}

/** Período vindo do endereço, só se for válido (retirada hoje ou depois, devolução depois da retirada, até 1 ano). */
export function parsePeriod(retirada: string | null, devolucao: string | null): { start: Date; end: Date } | null {
  const start = fromIso(retirada);
  const end = fromIso(devolucao);
  if (!start || !end) return null;
  const today = startOfDay(new Date());
  if (start < today || end < start || countDays(start, end) > 366) return null;
  return { start, end };
}
