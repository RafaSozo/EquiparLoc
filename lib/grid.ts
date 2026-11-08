/*
 * Grades da página inicial sem card "sobrando" sozinho na última linha.
 * Escolhe quantos itens mostrar e em quantas colunas, para as linhas fecharem cheias
 * no celular (1 coluna), no tablet (2) e no computador (3 ou 4).
 */

/** Quantos itens mostrar (até `max`) para fechar as linhas no tablet e no computador. */
export function fitCount(total: number, max = 6): number {
  const n = Math.min(total, max);
  if (n <= 2) return n;
  if (n % 6 === 0 || n === 4 || n === 8) return n; // fecham em 2 e em 3/4 colunas
  if (n >= 6) return n - (n % 6); // 7..11 → 6
  return n === 5 ? 4 : 3; // 5 → 4 (2x2 / 1x4); 3 fica 3
}

/** Classes de colunas (Tailwind) para `n` itens: 4 itens viram 4 colunas no computador, o resto 3. */
export function gridColsFor(n: number, from: 'sm' | 'md' = 'md'): string {
  // 1 a 3 itens cabem numa linha só: mantêm o tamanho normal do card (não esticam)
  if (n <= 3) return from === 'sm' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3';
  if (n % 4 === 0 && n % 3 !== 0) {
    return from === 'sm' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  }
  return from === 'sm' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
}
