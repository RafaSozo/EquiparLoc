import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper';
import { getSiteMenu } from '@/lib/site-menu';
import { getCompanySettings } from '@/lib/db';
import { toPublicCompany, digits, parseAddress, parseHours } from '@/lib/company';
import { SITE_URL, SITE_NAME, SITE_LEGAL_NAME, DEFAULT_OG_IMAGE, absoluteUrl, jsonLdHtml } from '@/lib/site';

// Archivo com eixo de largura: estreita nos títulos, normal no texto
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const defaultTitle = 'Locação de Máquinas Pesadas e Ferramentas para Obras | EquiparLoc';
const defaultDescription =
  'Aluguel de compactadores, placas vibratórias, betoneiras, martelos demolidores, geradores, miniescavadeiras e ferramentas para obra. Frota revisada e orçamento rápido.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: '%s',
  },
  description: defaultDescription,
  applicationName: SITE_NAME,
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE_NAME,
    url: '/',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'Máquinas e ferramentas para locação EquiparLoc' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: [DEFAULT_OG_IMAGE],
  },
};

export const viewport: Viewport = {
  themeColor: '#101820',
  width: 'device-width',
  initialScale: 1,
};

// O menu mostra os grupos de equipamentos cadastrados no painel: monta a cada acesso
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Menu e rodapé: linhas, categorias principais e serviços cadastrados no painel
  const menu = getSiteMenu();
  // Dados de Configurações no painel (telefone, e-mail, endereço...) para o site todo
  const company = toPublicCompany(getCompanySettings());
  const intlPhone = (v: string) => {
    const d = digits(v).replace(/^55(?=\d{10,11}$)/, '');
    return d.length >= 10 ? `+55-${d.slice(0, 2)}-${d.slice(2, -4)}-${d.slice(-4)}` : undefined;
  };
  const addr = parseAddress(company.address);
  const hours = parseHours(company.businessHours);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${SITE_URL}/#empresa`,
        name: 'EquiparLoc',
        legalName: SITE_LEGAL_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/images/logo-equiparloc.png'),
        image: absoluteUrl(DEFAULT_OG_IMAGE),
        description: defaultDescription,
        telephone: intlPhone(company.phone),
        email: company.email || undefined,
        taxID: company.cnpj || undefined,
        contactPoint: [company.phone, company.whatsapp]
          .map(intlPhone)
          .filter(Boolean)
          .map((telephone) => ({ '@type': 'ContactPoint', telephone, contactType: 'sales', availableLanguage: 'Portuguese' })),
        address: {
          '@type': 'PostalAddress',
          streetAddress: addr.street,
          addressLocality: addr.city,
          addressRegion: addr.state,
          postalCode: addr.cep,
          addressCountry: 'BR',
        },
        openingHoursSpecification: hours
          ? [
              {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: hours.opens,
                closes: hours.closes,
              },
            ]
          : undefined,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#site`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: 'pt-BR',
        publisher: { '@id': `${SITE_URL}/#empresa` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/locacao?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="pt-BR" className={archivo.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-white text-aco" suppressHydrationWarning>
        <ClientLayoutWrapper menu={menu} company={company}>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
