'use client';

import React, { createContext, useContext } from 'react';
import type { PublicCompany } from './types';

/** Dados da empresa vindos de Configurações no painel, para os componentes do navegador. */
const CompanyContext = createContext<PublicCompany | null>(null);

export function CompanyProvider({ company, children }: { company: PublicCompany; children: React.ReactNode }) {
  return <CompanyContext.Provider value={company}>{children}</CompanyContext.Provider>;
}

export function useCompany(): PublicCompany {
  const company = useContext(CompanyContext);
  if (!company) throw new Error('useCompany precisa estar dentro de CompanyProvider');
  return company;
}
