'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';

/**
 * Janela sobre a página (orçamento, busca) com movimento físico:
 * - mola sem oscilação para abrir/fechar (pode ser interrompida a qualquer momento);
 * - entra e sai pelo mesmo caminho;
 * - no celular (sheet), sobe de baixo e pode ser arrastada para baixo para fechar,
 *   respeitando a velocidade do dedo (um "peteleco" fecha mesmo com arrasto curto).
 * Movimento reduzido do sistema é respeitado pelo MotionConfig do layout.
 */

const SPRING = { type: 'spring', bounce: 0, duration: 0.4 } as const;
const SHEET_SPRING = { type: 'spring', bounce: 0, duration: 0.35 } as const;

// Projeção de impulso (mesma fórmula da rolagem do iOS)
function project(velocity: number, rate = 0.998) {
  return ((velocity / 1000) * rate) / (1 - rate);
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return mobile;
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 'center' = janela no meio; 'top' = cai do topo (busca) */
  placement?: 'center' | 'top';
  /** No celular vira uma folha que sobe de baixo e pode ser arrastada */
  sheetOnMobile?: boolean;
  label?: string;
  panelClassName?: string;
}

export function Dialog({
  open,
  onClose,
  children,
  placement = 'center',
  sheetOnMobile = false,
  label,
  panelClassName = '',
}: DialogProps) {
  const isMobile = useIsMobile();
  const sheet = sheetOnMobile && isMobile;
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  // Guarda a função de fechar sem reiniciar o efeito a cada renderização
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  // Trava a rolagem do fundo e fecha com Esc
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight || 600;
    const projected = info.offset.y + project(info.velocity.y);
    if (projected > height * 0.35) onClose();
  };

  const hidden = sheet
    ? { y: '100%' }
    : placement === 'top'
      ? { opacity: 0, y: -16, scale: 0.98 }
      : { opacity: 0, y: 12, scale: 0.96 };
  const shown = sheet ? { y: 0 } : { opacity: 1, y: 0, scale: 1 };

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={`fixed inset-0 z-50 flex justify-center ${
            sheet ? 'items-end' : placement === 'top' ? 'items-start p-4 sm:p-6 pt-16 sm:pt-20' : 'items-center p-4'
          }`}
        >
          {/* Escurece o fundo para focar na tarefa */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[#0C1218]/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            className={`relative w-full ${sheet ? 'max-h-[92vh] rounded-b-none' : ''} ${panelClassName}`}
            style={{ transformOrigin: placement === 'top' ? '50% 0%' : '50% 60%' }}
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={sheet ? SHEET_SPRING : SPRING}
            {...(sheet
              ? {
                  drag: 'y' as const,
                  dragListener: false,
                  dragControls,
                  dragConstraints: { top: 0, bottom: 0 },
                  dragElastic: { top: 0.04, bottom: 1 },
                  dragSnapToOrigin: true,
                  onDragEnd: handleDragEnd,
                }
              : {})}
          >
            {sheet && (
              // Alça: arraste para baixo para fechar
              <div
                className="absolute top-0 inset-x-0 z-10 flex justify-center pt-2 pb-3 cursor-grab active:cursor-grabbing touch-none"
                onPointerDown={(e) => dragControls.start(e)}
                aria-hidden="true"
              >
                <span className="block w-10 h-1.5 rounded-full bg-white/40" />
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
