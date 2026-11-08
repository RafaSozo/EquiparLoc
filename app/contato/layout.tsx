import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contato | Fale com a EquiparLoc – Locação de Máquinas e Ferramentas',
  description:
    'Fale com o comercial da EquiparLoc: telefone (31) 3418-1500, WhatsApp (31) 99197-0322 e e-mail comercial@equiparloc.com.br. Endereço: Av. Elias Antônio Issa, 695, Candelária, Belo Horizonte - MG. Atendimento de segunda a sexta, das 8h às 17h.',
  alternates: { canonical: '/contato' },
  openGraph: {
    title: 'Contato | EquiparLoc',
    description: 'Fale com a equipe comercial da EquiparLoc por telefone, WhatsApp ou e-mail.',
    url: '/contato',
    images: ['/images/hero/hero-obra-escavadeira-betoneira.jpg'],
  },
};

export default function ContatoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
