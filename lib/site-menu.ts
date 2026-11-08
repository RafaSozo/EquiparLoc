import { getAllCategories, getCategoriesWithCount, getProductLines } from './db';
import { isTopLevel, sortLines } from './category-tree';
import { slugify } from './site';
import type { Category, CategoryWithCount, ProductLine, SiteMenu } from './types';

/**
 * Tudo o que o site público precisa saber das linhas de produto.
 * As linhas do tipo "Locação" alimentam o menu Locação e a página /locacao;
 * as do tipo "Serviço" alimentam o menu Serviços e a página /servicos.
 */

export function getRentalLineIds(lines: ProductLine[] = getProductLines()): Set<string> {
  return new Set(lines.filter((l) => l.kind !== 'servico').map((l) => l.id));
}

export function getServiceLineIds(lines: ProductLine[] = getProductLines()): Set<string> {
  return new Set(lines.filter((l) => l.kind === 'servico').map((l) => l.id));
}

/** Âncora do serviço na página /servicos */
export const serviceAnchor = (name: string) => slugify(name);

/** Serviços: categorias principais das linhas de serviço, na ordem do painel (mesmo sem itens). */
export function getServiceCategories(): { line: ProductLine; categories: Category[] }[] {
  const lines = sortLines(getProductLines().filter((l) => l.kind === 'servico'));
  const all = getAllCategories();
  return lines
    .map((line) => ({ line, categories: all.filter((c) => c.group === line.id && isTopLevel(c, all)) }))
    .filter((g) => g.categories.length > 0);
}

/** Categorias com itens publicados que pertencem às linhas de locação. */
export function getRentalCategoriesWithCount(): CategoryWithCount[] {
  const rental = getRentalLineIds();
  return getCategoriesWithCount(true).filter((c) => rental.has(c.group));
}

export function getSiteMenu(): SiteMenu {
  const lines = getProductLines();
  const rental = getRentalLineIds(lines);
  const withCount = getCategoriesWithCount(true);
  return {
    lines: lines.filter((l) => rental.has(l.id)).map((l) => ({ id: l.id, name: l.name })),
    categories: withCount
      .filter((c) => rental.has(c.group) && isTopLevel(c, withCount))
      .map((c) => ({ name: c.name, count: c.count, group: c.group })),
    services: getServiceCategories().flatMap(({ categories }) =>
      categories.map((c) => ({ slug: serviceAnchor(c.name), name: c.name, summary: c.description, image: c.image }))
    ),
  };
}
