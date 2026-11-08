import type { Category, CategoryGroup } from './types';

/**
 * Categorias em dois níveis, como no WordPress: categoria principal e subcategoria.
 * Uma subcategoria é uma categoria com `parentId`. Só existe um nível de subcategoria.
 * Funções puras: servem tanto para o painel quanto para o site.
 */

export const CATEGORY_GROUPS: CategoryGroup[] = ['maquinas', 'ferramentas'];

type Cat = Pick<Category, 'id' | 'name' | 'group' | 'order'> & { parentId?: string };

const byOrder = (a: Cat, b: Cat) => a.order - b.order || a.name.localeCompare(b.name);

/** Pai válido da categoria (ignora pai apagado ou apontando para si mesma). */
export function parentOf<T extends Cat>(cat: T, all: T[]): T | undefined {
  if (!cat.parentId || cat.parentId === cat.id) return undefined;
  const parent = all.find((c) => c.id === cat.parentId);
  // Só um nível: o pai precisa ser principal
  return parent && !parentOf(parent, all) ? parent : undefined;
}

export function isTopLevel<T extends Cat>(cat: T, all: T[]): boolean {
  return !parentOf(cat, all);
}

export function childrenOf<T extends Cat>(cat: T, all: T[]): T[] {
  return all.filter((c) => c.id !== cat.id && parentOf(c, all)?.id === cat.id).sort(byOrder);
}

export interface TreeRow<T> {
  cat: T;
  depth: 0 | 1;
}

/** Lista em árvore: cada principal seguida das suas subcategorias. Opcionalmente de uma linha só. */
export function categoryTree<T extends Cat>(all: T[], group?: CategoryGroup): TreeRow<T>[] {
  const rows: TreeRow<T>[] = [];
  const groups = group ? [group] : CATEGORY_GROUPS;
  for (const g of groups) {
    all
      .filter((c) => c.group === g && isTopLevel(c, all))
      .sort(byOrder)
      .forEach((top) => {
        rows.push({ cat: top, depth: 0 });
        childrenOf(top, all).forEach((child) => rows.push({ cat: child, depth: 1 }));
      });
  }
  return rows;
}

/** Nomes da categoria e das subcategorias dela (para filtrar os itens de uma principal). */
export function namesInBranch<T extends Cat>(name: string, all: T[]): Set<string> {
  const cat = all.find((c) => c.name === name);
  const names = new Set([name]);
  if (cat) childrenOf(cat, all).forEach((c) => names.add(c.name));
  return names;
}

/** "Principal › Subcategoria" (ou só o nome, quando é principal). */
export function categoryLabel<T extends Cat>(name: string, all: T[]): string {
  const cat = all.find((c) => c.name === name);
  const parent = cat && parentOf(cat, all);
  return parent ? `${parent.name} › ${name}` : name;
}
