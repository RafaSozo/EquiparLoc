'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'motion/react';
import { QuoteModalProvider } from '@/lib/quote-modal-context';
import { Header, type MenuCategory } from './Header';
import { Footer } from './Footer';
import { QuoteModal } from './QuoteModal';
import { CookieBanner } from './CookieBanner';
import { GlobalSearchModal } from './search/GlobalSearchModal';

import { AuthProvider } from './auth/AuthProvider';

export function ClientLayoutWrapper({ children, menuCategories = [] }: { children: React.ReactNode; menuCategories?: MenuCategory[] }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');

  return (
    // reducedMotion="user": quem pediu menos movimento no sistema recebe só transições de opacidade
    <MotionConfig reducedMotion="user">
    <AuthProvider>
      <QuoteModalProvider>
        {!isAdmin && (
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[#FF6500] focus:text-white focus:text-sm focus:font-semibold focus:rounded-lg"
          >
            Pular para o conteúdo
          </a>
        )}
        {!isAdmin && <Header categories={menuCategories} />}
        <div id="conteudo" tabIndex={-1} className="outline-none">
          {children}
        </div>
        {!isAdmin && <Footer categories={menuCategories} />}
        <QuoteModal />
        <CookieBanner />
        {!isAdmin && <GlobalSearchModal />}
      </QuoteModalProvider>
    </AuthProvider>
    </MotionConfig>
  );
}
