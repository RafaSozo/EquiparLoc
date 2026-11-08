import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solicitar Orçamento de Locação de Equipamentos | EquiparLoc',
  description:
    'Peça seu orçamento de locação de compactadores, betoneiras, martelos demolidores, geradores e ferramentas. Informe a máquina, o local da obra e o período e receba a proposta da EquiparLoc.',
  alternates: { canonical: '/orcamento' },
  openGraph: {
    title: 'Solicitar Orçamento de Locação | EquiparLoc',
    description: 'Receba uma proposta de locação de máquinas pesadas para a sua obra.',
    url: '/orcamento',
    images: ['/images/hero/hero-obra-escavadeira-betoneira.jpg'],
  },
};

export default function OrcamentoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
