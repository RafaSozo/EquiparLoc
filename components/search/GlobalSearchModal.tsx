'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiboLiveSearch } from './FiboLiveSearch';
import { X } from 'lucide-react';
import { Dialog } from '../ui/Dialog';

export function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open={isOpen} onClose={close} placement="top" label="Busca de equipamentos" panelClassName="max-w-3xl">
        <div className="flex items-center justify-between mb-2 px-1 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-laranja animate-pulse" />
            <span>EquiparLoc | Busca Inteligente de Frota & Conteúdo</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-[4px] text-[#C6CDD3] hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <FiboLiveSearch
          mode="modal"
          isOpenModal={isOpen}
          onCloseModal={() => setIsOpen(false)}
          placeholder="Digite o equipamento desejado, capacidade ou artigo técnico (ex: betoneira, martelo 10 kg, gerador)..."
          autoFocus
        />
    </Dialog>
  );
}
