import {
  getAllEquipments,
  getAllBlogPosts,
  getCompanySettings,
  getAboutPage,
  getCategoriesWithCount,
  getProductLines,
} from './db';
import { getServiceCategories } from './site-menu';
import { absoluteUrl, categoryPath, equipmentPath, slugify, SITE_NAME, SITE_LEGAL_NAME } from './site';
import { formatPhone, hoursParts, waHref } from './company';
import { isPublished } from './public-data';
import type { Equipment } from './types';

/*
 * Versões em texto (Markdown) do site para assistentes de IA e buscadores:
 * /llms.txt e as páginas pedidas com "Accept: text/markdown".
 * Só usa o que já é público no site (nada de orçamentos, mensagens ou rascunhos).
 */

const active = () => getAllEquipments().filter((e) => e.status === 'active');

function contactBlock(): string {
  const c = getCompanySettings();
  return [
    '## Contato',
    '',
    `- Telefone: ${c.phone}`,
    `- WhatsApp: ${formatPhone(c.whatsapp)} (${waHref(c.whatsapp)})`,
    `- E-mail: ${c.email}`,
    `- Endereço: ${c.address}`,
    ...hoursParts(c.businessHours).map((h) => `- Horário: ${h}`),
    `- Pedir orçamento: ${absoluteUrl('/orcamento')}`,
  ].join('\n');
}

function equipmentLine(eq: Equipment): string {
  const summary = (eq.summary || eq.description || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  return `- [${eq.name}](${absoluteUrl(equipmentPath(eq))})${summary ? `: ${summary}` : ''}`;
}

/** Resumo do site no formato llms.txt (https://llmstxt.org) */
export function buildLlmsTxt(): string {
  const c = getCompanySettings();
  const lines = getProductLines();
  const cats = getCategoriesWithCount(true);
  const services = getServiceCategories().flatMap((g) => g.categories);
  const posts = getAllBlogPosts().filter(isPublished);

  const out: string[] = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_LEGAL_NAME}${c.cnpj ? ` (CNPJ ${c.cnpj})` : ''}: locação de máquinas pesadas e ferramentas para obras em Belo Horizonte e região, com oficina própria e entrega no canteiro.`,
    '',
    'Os preços não são publicados: cada locação é orçada pelo período, pelo local da obra e pelo frete. Para cotar, use a página de orçamento ou o WhatsApp.',
    '',
    '## Páginas principais',
    '',
    `- [Início](${absoluteUrl('/')}): visão geral, categorias e destaques`,
    `- [Locação](${absoluteUrl('/locacao')}): catálogo completo de equipamentos`,
    `- [Serviços](${absoluteUrl('/servicos')}): serviços executados com equipe própria`,
    `- [Empresa](${absoluteUrl('/empresa')}): quem somos`,
    `- [Contato](${absoluteUrl('/contato')}): telefone, WhatsApp, e-mail e formulário`,
    `- [Localização](${absoluteUrl('/localizacao')}): endereço e mapa`,
    `- [Pedir orçamento](${absoluteUrl('/orcamento')})`,
    `- [Blog](${absoluteUrl('/blog')}): guias técnicos para planejar a obra`,
    `- [Política de privacidade](${absoluteUrl('/privacidade')})`,
    '',
  ];

  for (const line of lines.filter((l) => l.kind === 'locacao')) {
    const lineCats = cats.filter((cat) => cat.group === line.id);
    if (!lineCats.length) continue;
    out.push(`## ${line.name}`, '');
    for (const cat of lineCats) {
      const desc = cat.description ? `. ${cat.description}` : '';
      out.push(`- [${cat.name}](${absoluteUrl(categoryPath(cat.name))}): ${cat.count} ${cat.count === 1 ? 'modelo' : 'modelos'}${desc}`);
    }
    out.push('');
  }

  if (services.length) {
    out.push('## Serviços', '');
    for (const s of services) {
      out.push(`- [${s.name}](${absoluteUrl(`/servicos#${slugify(s.name)}`)})${s.description ? `: ${s.description}` : ''}`);
    }
    out.push('');
  }

  if (posts.length) {
    out.push('## Blog', '');
    for (const p of posts) out.push(`- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)})`);
    out.push('');
  }

  out.push(contactBlock(), '');
  return out.join('\n');
}

/** Markdown de uma página do site, ou null se o endereço não tiver versão em texto. */
export function buildPageMarkdown(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') {
    const featured = active().filter((e) => e.isFeatured).slice(0, 12);
    const extra = featured.length ? `\n## Destaques para locação\n\n${featured.map(equipmentLine).join('\n')}\n` : '';
    return buildLlmsTxt() + extra;
  }

  if (path === '/locacao') {
    const items = active();
    const out = ['# Locação de máquinas e ferramentas', ''];
    for (const cat of getCategoriesWithCount(true)) {
      const list = items.filter((e) => e.category === cat.name);
      if (!list.length) continue;
      out.push(`## [${cat.name}](${absoluteUrl(categoryPath(cat.name))})`, '', ...list.map(equipmentLine), '');
    }
    out.push(contactBlock());
    return out.join('\n');
  }

  if (path === '/empresa') {
    const a = getAboutPage();
    return [
      `# ${a.heroTitle}`,
      '',
      a.heroText,
      '',
      `## ${a.sectionTitle}`,
      '',
      a.sectionText,
      '',
      ...a.cards.map((card) => `- **${card.title}**: ${card.text}`),
      '',
      `## ${a.pillarsTitle}`,
      '',
      ...a.pillars.map((p) => `- **${p.title}**: ${p.text}`),
      '',
      contactBlock(),
    ].join('\n');
  }

  if (path === '/contato' || path === '/localizacao' || path === '/orcamento') {
    return [`# Fale com a ${SITE_NAME}`, '', contactBlock()].join('\n');
  }

  if (path === '/servicos') {
    const out = ['# Serviços', ''];
    for (const s of getServiceCategories().flatMap((g) => g.categories)) {
      out.push(`## ${s.name}`, '', s.content || s.description || '', '');
      if (s.highlights?.length) out.push(...s.highlights.map((h) => `- ${h}`), '');
    }
    out.push(contactBlock());
    return out.join('\n');
  }

  // /locacao/categoria e /locacao/categoria/produto
  const m = path.match(/^\/locacao\/([^/]+)(?:\/([^/]+))?$/);
  if (!m) return null;
  const [, catSlug, productSlug] = m;
  const items = active();

  if (productSlug) {
    const eq = items.find((e) => e.slug === productSlug && slugify(e.category) === catSlug);
    if (!eq) return null;
    const specs: [string, string | undefined][] = [
      ['Peso operacional', eq.specs.operatingWeight],
      ['Potência', eq.specs.power],
      ['Capacidade', eq.specs.bucketCapacity],
      ['Alcance', eq.specs.maxReach],
      ['Profundidade / altura', eq.specs.maxDigDepth],
      ['Combustível', eq.specs.fuelType],
      ['Tanque', eq.specs.fuelTankCapacity],
      ['Dimensões', eq.specs.dimensions],
      ...Object.entries(eq.specs.additional || {}),
    ];
    return [
      `# ${eq.name}`,
      '',
      `Código ${eq.code}. Categoria: [${eq.category}](${absoluteUrl(categoryPath(eq.category))}). Entrega: ${eq.deliveryTime}.`,
      '',
      eq.description,
      '',
      '## Ficha técnica',
      '',
      ...specs.filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`),
      '',
      ...(eq.applications.length ? ['## Onde usar', '', ...eq.applications.map((a) => `- ${a}`), ''] : []),
      ...(eq.features.length ? ['## Recursos', '', ...eq.features.map((f) => `- ${f}`), ''] : []),
      ...(eq.safetyNotes ? [`Segurança: ${eq.safetyNotes}`, ''] : []),
      contactBlock(),
    ].join('\n');
  }

  const cat = getCategoriesWithCount().find((c) => slugify(c.name) === catSlug);
  if (!cat) return null;
  const list = items.filter((e) => slugify(e.category) === catSlug);
  return [`# ${cat.name}`, '', cat.description || '', '', ...list.map(equipmentLine), '', contactBlock()].join('\n');
}
