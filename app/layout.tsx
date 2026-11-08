import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';
import { ClientLayoutWrapper } from '@/components/ClientLayoutWrapper';
import { getCategoriesWithCount } from '@/lib/db';
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
  const menuCategories = getCategoriesWithCount(true).map((c) => ({ name: c.name, count: c.count, group: c.group }));
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
        telephone: '+55-31-3418-1500',
        email: 'comercial@equiparloc.com.br',
        taxID: '57.309.078/0001-00',
        contactPoint: [
          { '@type': 'ContactPoint', telephone: '+55-31-3418-1500', contactType: 'sales', availableLanguage: 'Portuguese' },
          { '@type': 'ContactPoint', telephone: '+55-31-99197-0322', contactType: 'sales', availableLanguage: 'Portuguese' },
        ],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Av. Elias Antônio Issa, 695',
          addressLocality: 'Belo Horizonte',
          addressRegion: 'MG',
          postalCode: '31570-010',
          addressCountry: 'BR',
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '07:30',
            closes: '18:00',
          },
        ],
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
        <ClientLayoutWrapper menuCategories={menuCategories}>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
