// Interpreta o conteúdo dos artigos do blog (markdown simples) em blocos estruturados.
// Suporta: ## / ### títulos, parágrafos, listas (- item / 1. item),
// links [texto](url) e **negrito**.

export type ArticleBlock =
  | { type: 'h2' | 'h3'; id: string; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const isUlLine = (l: string) => /^[-*]\s+/.test(l);
const isOlLine = (l: string) => /^\d+[.)]\s+/.test(l);

export function parseArticle(content: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  const usedIds = new Set<string>();
  const uniqueId = (text: string) => {
    const base = slugifyHeading(text) || 'secao';
    let id = base;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);
    return id;
  };

  const lines = content.replace(/\r\n/g, '\n').split('\n');
  let paragraph: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: 'p', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const text = heading[2].trim();
      blocks.push({ type: heading[1].length === 2 ? 'h2' : 'h3', id: uniqueId(text), text });
      continue;
    }

    if (isUlLine(line) || isOlLine(line)) {
      flushParagraph();
      const type = isUlLine(line) ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(line.replace(/^([-*]|\d+[.)])\s+/, ''));
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return blocks;
}

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'link'; text: string; href: string };

/** Quebra um texto em trechos simples, negrito e links. */
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    if (m.index > last) tokens.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ type: 'link', text: m[1], href: m[2] });
    else tokens.push({ type: 'strong', value: m[3] });
    last = regex.lastIndex;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

/** Remove a marcação markdown, deixando só o texto (útil para descrições). */
export function stripInline(text: string): string {
  return parseInline(text)
    .map((t) => (t.type === 'link' ? t.text : t.value))
    .join('');
}
