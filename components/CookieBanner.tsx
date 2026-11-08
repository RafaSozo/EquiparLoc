'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('equipar_cookie_consent');
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('equipar_cookie_consent', 'all');
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem('equipar_cookie_consent', 'essential');
    } catch {
      // Ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-white border border-concreto rounded-[6px] shadow-xl p-4 text-xs text-aco-medio animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-concreto text-aco rounded-[4px] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="font-semibold text-aco text-sm">Privacidade e Transparência</p>
          <p className="leading-relaxed">
            Utilizamos cookies essenciais e métricas de desempenho anônimas para otimizar sua experiência no catálogo de máquinas e dimensionar orçamentos com precisão, em conformidade com a LGPD.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-1.5 bg-laranja hover:bg-laranja-escuro text-aco font-semibold rounded-[4px] transition-colors text-xs"
            >
              Aceitar todos
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="px-3 py-1.5 bg-concreto hover:bg-[#D3D6D1] text-aco-medio font-medium rounded-[4px] transition-colors text-xs"
            >
              Apenas necessários
            </button>
            <Link
              href="/privacidade"
              className="text-xs text-aco-medio hover:text-aco underline ml-auto"
            >
              Política
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReject}
          className="text-aco-medio hover:text-aco-medio p-1"
          aria-label="Fechar banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
