'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MESES, DIAS_SEMANA, startOfDay, toIso, formatBr, countDays, isWeekend } from '@/lib/periodo';

/*
 * Calendário de locação, aberto pelo botão "Separar datas" do quadro do pátio.
 * 1º clique = retirada, 2º clique = devolução. Retirada e devolução só em dias úteis
 * (o atendimento é de segunda a sexta); o período pode atravessar o fim de semana.
 */

const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MAX_MONTHS_AHEAD = 12;

function sameDay(a: Date | null, b: Date | null) {
  return !!a && !!b && a.getTime() === b.getTime();
}

interface RentalCalendarProps {
  /** true = dentro de outra placa (sem moldura nem título próprios) */
  embedded?: boolean;
}

export function RentalCalendar({ embedded = false }: RentalCalendarProps = {}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [direction, setDirection] = useState(0);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);

  const monthIndex = (view.getFullYear() - today.getFullYear()) * 12 + view.getMonth() - today.getMonth();
  const canPrev = monthIndex > 0;
  const canNext = monthIndex < MAX_MONTHS_AHEAD;

  const go = (delta: number) => {
    setDirection(delta);
    setView(new Date(view.getFullYear(), view.getMonth() + delta, 1));
  };

  // Dias do mês com espaços vazios antes do dia 1 (a semana começa no domingo)
  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const list: (Date | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= total; d++) list.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (list.length % 7) list.push(null);
    return list;
  }, [view]);

  const selectable = (d: Date) => d >= today && !isWeekend(d);

  const pick = (d: Date) => {
    if (!selectable(d)) return;
    if (!start || end || d < start) {
      setStart(d);
      setEnd(null);
    } else {
      setEnd(d);
    }
  };

  // Faixa mostrada: período escolhido, ou prévia enquanto o mouse passa pelos dias
  const rangeEnd = end || (start && hover && hover > start ? hover : null);
  const inRange = (d: Date) => !!start && !!rangeEnd && d > start && d < rangeEnd;

  const days = start && end ? countDays(start, end) : null;
  const href = start && end ? `/orcamento?retirada=${toIso(start)}&devolucao=${toIso(end)}` : '/orcamento';
  const monthLabel = `${MESES[view.getMonth()]} de ${view.getFullYear()}`;

  return (
    <div
      className={
        embedded
          ? 'text-white'
          : 'placa bg-aco/95 text-white px-5 sm:px-6 pt-5 pb-5 ring-1 ring-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]'
      }
      style={embedded ? undefined : { ['--rebite' as string]: '#56626C' }}
    >
      {embedded ? (
        <p className="px-2 text-xs text-[#B9C1C8]">Escolha o dia da retirada e o da devolução.</p>
      ) : (
        <div className="px-2">
          <h2 className="type-display text-2xl">Quando você precisa?</h2>
          <p className="text-xs text-[#B9C1C8] mt-1">Escolha o dia da retirada e o da devolução.</p>
        </div>
      )}

      {/* Navegação entre meses */}
      <div className={`${embedded ? 'mt-2' : 'mt-4'} flex items-center justify-between px-1`}>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={!canPrev}
          aria-label="Mês anterior"
          className="w-9 h-9 flex items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span aria-live="polite" className="text-sm font-bold first-letter:uppercase">
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={!canNext}
          aria-label="Próximo mês"
          className="w-9 h-9 flex items-center justify-center rounded-full text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-[#8E99A3]" aria-hidden="true">
        {INICIAIS.map((l, i) => (
          <span key={i} className="py-1">
            {l}
          </span>
        ))}
      </div>

      {/* Grade do mês: desliza para o lado na direção da troca de mês */}
      <div className="relative overflow-hidden" onMouseLeave={() => setHover(null)}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={monthLabel}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="grid grid-cols-7 gap-y-1"
            role="grid"
            aria-label={`Calendário de ${monthLabel}`}
          >
            {cells.map((d, i) => {
              if (!d) return <span key={i} />;
              const isStart = sameDay(d, start);
              const isEnd = sameDay(d, end) || (!end && sameDay(d, rangeEnd));
              const between = inRange(d);
              const ok = selectable(d);
              const isToday = sameDay(d, today);
              // Faixa contínua entre retirada e devolução (arredondada só nas pontas)
              const band =
                (between || ((isStart || isEnd) && start && rangeEnd && !sameDay(start, rangeEnd))) &&
                `bg-laranja/20 ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`;
              return (
                <div key={i} role="gridcell" className={`flex justify-center ${band || ''}`}>
                  <button
                    type="button"
                    onClick={() => pick(d)}
                    onMouseEnter={() => setHover(d)}
                    disabled={!ok}
                    aria-pressed={isStart || sameDay(d, end)}
                    aria-label={`${d.getDate()} de ${MESES[d.getMonth()]}, ${DIAS_SEMANA[d.getDay()]}${
                      isStart ? ' (retirada)' : sameDay(d, end) ? ' (devolução)' : ''
                    }${!ok ? ', indisponível' : ''}`}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-sm tabular-nums transition-colors ${
                      isStart || isEnd
                        ? 'bg-laranja text-aco font-bold'
                        : between
                          ? 'text-white font-semibold'
                          : ok
                            ? 'text-white hover:bg-white/15'
                            : 'text-white/25 cursor-not-allowed'
                    } ${isToday && !isStart && !isEnd ? 'ring-1 ring-inset ring-white/50' : ''}`}
                  >
                    {d.getDate()}
                  </button>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Resumo do período */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 px-2">
        <div>
          <span className="block text-[11px] text-[#8E99A3]">Retirada</span>
          <span className="block text-sm font-bold tabular-nums">{start ? formatBr(start).slice(0, 5) : '--/--'}</span>
        </div>
        <div>
          <span className="block text-[11px] text-[#8E99A3]">Devolução</span>
          <span className="block text-sm font-bold tabular-nums">{end ? formatBr(end).slice(0, 5) : '--/--'}</span>
        </div>
        <div className="text-right">
          <span className="block text-[11px] text-[#8E99A3]">Período</span>
          <span className="type-display text-[1.75rem] leading-none">{days ?? 0}</span>
          <span className="ml-1 text-sm text-[#B9C1C8]">{days === 1 ? 'dia' : 'dias'}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Link href={href} className={`btn-acao flex-1 px-4 py-3 text-sm ${days ? '' : 'opacity-90'}`}>
          {days ? `Pedir orçamento para ${days} ${days === 1 ? 'dia' : 'dias'}` : 'Pedir orçamento'}
        </Link>
        {start && (
          <button
            type="button"
            onClick={() => {
              setStart(null);
              setEnd(null);
            }}
            className="text-sm font-semibold text-[#C6CDD3] underline underline-offset-4 hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>
      <p className="mt-3 text-[11px] text-[#8E99A3] px-1">Retirada e devolução de segunda a sexta.</p>
    </div>
  );
}
