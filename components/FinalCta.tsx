'use client';

import React from 'react';
import { useQuoteModal } from '@/lib/quote-modal-context';
import { trackWhatsAppClick } from '@/lib/analytics';
import { MessageSquare } from 'lucide-react';

export function FinalCta() {
  const { openQuoteModal } = useQuoteModal();

  const handleWhatsApp = () => {
    trackWhatsAppClick('CTA Final', 'FINAL');
    window.open(
      'https://wa.me/5531991970322?text=Ol%C3%A1%20EquiparLoc!%20Gostaria%20de%20falar%20com%20um%20especialista%20para%20dimensionar%20equipamentos%20para%20minha%20obra.',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <section className="bg-chapa py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="placa bg-aco text-white px-6 sm:px-12 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end"
          style={{ ['--rebite' as string]: '#56626C' }}
        >
          <div className="lg:col-span-7">
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-[0.95] text-balance">
              Não sabe qual máquina serve para a sua obra?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#C6CDD3] max-w-xl leading-relaxed">
              Conte o tipo de solo, a altura de trabalho e o prazo. Nossa equipe indica o modelo e combina a entrega.
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <button type="button" onClick={() => openQuoteModal()} className="btn-acao px-6 py-3.5 text-base">
              Pedir orçamento
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white border-2 border-white/40 rounded-[4px] hover:border-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Conversar pelo WhatsApp
            </button>
            <p className="text-sm text-[#C6CDD3]">
              Ou ligue: <a href="tel:+553134181500" className="font-semibold text-white underline underline-offset-4">(31) 3418-1500</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
