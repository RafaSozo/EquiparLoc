import type { AboutPageContent } from './types';

/** Conteúdo inicial da página Empresa (o painel pode mudar tudo). */
export const DEFAULT_ABOUT: AboutPageContent = {
  heroTitle: 'A parceira estratégica para a engenharia da sua obra',
  heroText:
    'Atuamos na locação de máquinas pesadas e ferramentas para obra com foco absoluto na disponibilidade operacional, conformidade com as normas regulamentadoras e pontualidade na mobilização.',
  sectionTitle: 'Pátio operacional estruturado e oficina técnica especializada',
  sectionText:
    'A EquiparLoc conta com instalações dedicadas à manutenção preventiva e corretiva de equipamentos de grande porte.\n\nNosso compromisso não se encerra na entrega da máquina: mantemos monitoramento de telemetria contínuo, controle rigoroso de horímetro e equipes móveis de socorro mecânico para atender prontamente a qualquer intercorrência no canteiro.',
  image: '/images/hero/hero-miniescavadeira-basculante.jpg',
  imageAlt: 'Miniescavadeira e minidumper trabalhando em obra',
  cards: [
    { title: 'Checklist de 40 Itens', text: 'Inspecionamos pressão, filtros e freios antes de cada embarque.' },
    { title: 'Conformidade NR', text: 'Laudos vigentes de NR-11, NR-12 e NR-18 acompanham cada máquina.' },
  ],
  pillarsTitle: 'Diretrizes de Atuação EquiparLoc',
  pillarsText: 'Práticas e compromissos operacionais validados no dia a dia da construção pesada.',
  pillars: [
    {
      title: 'Produtividade Sem Paradas',
      text: 'Fornecer equipamentos em perfeito estado de conservação mecânica para que obras civis e industriais cumpram seus cronogramas com segurança e previsibilidade financeira.',
    },
    {
      title: 'Referência Técnica em Locação',
      text: 'Ser reconhecida pelos maiores contratantes e construtoras do país como o parceiro mais confiável e transparente no suporte a frotas pesadas.',
    },
    {
      title: 'Segurança em Primeiro Lugar',
      text: 'Vida humana e integridade operacional não são negociáveis. Nenhum equipamento sai do pátio sem certificação técnica e revisão aprovada.',
    },
  ],
  ctaTitle: 'Precisa de consultoria para a próxima etapa da sua obra?',
  ctaText: 'Nossa equipe de engenharia está pronta para analisar seus projetos e dimensionar os equipamentos ideais.',
};

const text = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '';

const cards = (v: unknown, max: number) =>
  Array.isArray(v)
    ? v
        .slice(0, max)
        .map((c) => ({ title: text(c?.title, 160), text: text(c?.text, 600) }))
        .filter((c) => c.title || c.text)
    : [];

/** Limpa o que chega do painel: só campos conhecidos, com tamanho máximo. */
export function sanitizeAbout(input: Record<string, unknown>): AboutPageContent {
  const image = text(input.image, 300);
  return {
    heroTitle: text(input.heroTitle, 160),
    heroText: text(input.heroText, 600),
    sectionTitle: text(input.sectionTitle, 160),
    sectionText: text(input.sectionText, 3000),
    // Só fotos do próprio site (pasta /images ou enviadas pelo painel)
    image: /^\/(images|api\/midia)\//.test(image) ? image : DEFAULT_ABOUT.image,
    imageAlt: text(input.imageAlt, 160),
    cards: cards(input.cards, 4),
    pillarsTitle: text(input.pillarsTitle, 160),
    pillarsText: text(input.pillarsText, 600),
    pillars: cards(input.pillars, 6),
    ctaTitle: text(input.ctaTitle, 160),
    ctaText: text(input.ctaText, 600),
  };
}
