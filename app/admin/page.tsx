import React from 'react';
import type { Metadata } from 'next';
import { getAllEquipments, getAllQuotes, getAllBlogPosts, getCompanySettings, getCategoriesWithCount, getProductLines } from '@/lib/db';
import { getServerAuthSession, hasConfiguredUsers } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import type { CompanySettings } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Painel administrativo | EquiparLoc',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

const EMPTY_SETTINGS: CompanySettings = {
  companyName: '',
  tradeName: '',
  cnpj: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  businessHours: '',
  gaMeasurementId: '',
  adminPin: '',
};

export default async function AdminPage() {
  const session = await getServerAuthSession();

  // Sem login: só a tela de entrada. Orçamentos (dados de clientes), rascunhos e
  // configurações nunca são enviados ao navegador de quem não está autenticado.
  if (!session?.user) {
    return (
      <AdminDashboard
        key="anon"
        authenticated={false}
        loginConfigured={hasConfiguredUsers()}
        initialCategories={[]}
        initialLines={[]}
        initialEquipments={[]}
        initialQuotes={[]}
        initialBlog={[]}
        initialSettings={EMPTY_SETTINGS}
      />
    );
  }

  const { adminPin: _pin, ...settings } = getCompanySettings();

  return (
    <AdminDashboard
      key={session.user.id || 'auth'}
      authenticated
      loginConfigured
      initialCategories={getCategoriesWithCount()}
      initialLines={getProductLines()}
      initialEquipments={getAllEquipments()}
      initialQuotes={getAllQuotes()}
      initialBlog={getAllBlogPosts()}
      initialSettings={{ ...settings, adminPin: '' }}
    />
  );
}
