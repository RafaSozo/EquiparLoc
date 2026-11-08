'use client';

import React, { createContext, useContext, useState } from 'react';
import { Equipment } from './types';

interface QuoteModalContextType {
  isOpen: boolean;
  selectedEquipment: Equipment | null;
  openQuoteModal: (equipment?: Equipment | null) => void;
  closeQuoteModal: () => void;
}

const QuoteModalContext = createContext<QuoteModalContextType | undefined>(undefined);

export function QuoteModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const openQuoteModal = (equipment?: Equipment | null) => {
    setSelectedEquipment(equipment || null);
    setIsOpen(true);
  };

  const closeQuoteModal = () => {
    setIsOpen(false);
  };

  return (
    <QuoteModalContext.Provider
      value={{
        isOpen,
        selectedEquipment,
        openQuoteModal,
        closeQuoteModal,
      }}
    >
      {children}
    </QuoteModalContext.Provider>
  );
}

export function useQuoteModal() {
  const context = useContext(QuoteModalContext);
  if (!context) {
    throw new Error('useQuoteModal must be used within a QuoteModalProvider');
  }
  return context;
}
