import type { Metadata } from 'next';
import { getCompanySettings } from '@/lib/db';
import { formatPhone, hoursParts } from '@/lib/company';

export function generateMetadata(): Metadata {
  const c = getCompanySettings();
  return {
  title: 'Contato | Fale com a EquiparLoc – Locação de Máquinas e Ferramentas',
  description: `Fale com o comercial da EquiparLoc: telefone ${c.phone}, WhatsApp ${formatPhone(c.whatsapp)} e e-mail ${c.email}. Endereço: ${c.address}. ${hoursParts(c.businessHours)[0] || ''}`.trim(),
  alternates: { canonical: '/contato' },
  openGraph: {
    title: 'Contato | EquiparLoc',
    description: 'Fale com a equipe comercial da EquiparLoc por telefone, WhatsApp ou e-mail.',
    url: '/contato',
    images: ['/images/hero/hero-obra-escavadeira-betoneira.jpg'],
  },
  };
}

export default function ContatoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
