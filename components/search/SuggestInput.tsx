'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { equipmentPath } from '@/lib/site';

/**
 * Campo de texto com sugestões da pesquisa inteligente (/api/search).
 * Assim que o cliente digita 2 letras, aparece a lista de equipamentos
 * (ou artigos, com type="blog"). Teclado: ↑ ↓ Enter Esc.
 */
export interface Suggestion {
  id: string;
  label: string;
  sublabel?: string;
  image?: string;
  slug: string;
  /** Endereço da página do item */
  href: string;
}

type SuggestInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSelect' | 'type'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Chamado quando o cliente escolhe uma sugestão */
  onSuggestionSelect?: (s: Suggestion) => void;
  type?: 'equipment' | 'blog';
  /** Classe do <div> que envolve o campo (o campo em si usa className) */
  wrapperClassName?: string;
};

export function SuggestInput({
  value,
  onValueChange,
  onSuggestionSelect,
  type = 'equipment',
  wrapperClassName = '',
  onKeyDown,
  onFocus,
  ...inputProps
}: SuggestInputProps) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const skipNext = useRef(false);
  const listId = useId();

  // Busca com espera curta enquanto digita
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=6`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        const list: Suggestion[] =
          type === 'blog'
            ? (data.blogPosts || []).map((p: { id: string; title: string; category: string; image: string; slug: string }) => ({
                id: p.id, label: p.title, sublabel: p.category, image: p.image, slug: p.slug, href: `/blog/${p.slug}`,
              }))
            : (data.equipments || []).map((e: { id: string; name: string; category: string; image: string; slug: string }) => ({
                id: e.id, label: e.name, sublabel: e.category, image: e.image, slug: e.slug, href: equipmentPath(e),
              }));
        setItems(list);
        setActive(-1);
        setOpen(list.length > 0 && document.activeElement === wrapRef.current?.querySelector('input'));
      } catch {
        // busca cancelada ou sem rede: só não mostra sugestões
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [value, type]);

  // Fecha ao clicar fora
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (s: Suggestion) => {
    skipNext.current = true;
    onValueChange(s.label);
    setOpen(false);
    onSuggestionSelect?.(s);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && items.length) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
        return;
      }
      if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        choose(items[active]);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  return (
    <div ref={wrapRef} className={`relative ${wrapperClassName}`}>
      <input
        {...inputProps}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={(e) => {
          if (items.length) setOpen(true);
          onFocus?.(e);
        }}
        onKeyDown={handleKey}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 top-full mt-1 z-50 w-full min-w-[min(22rem,90vw)] max-h-80 overflow-y-auto bg-white border border-concreto rounded-[6px] shadow-lg py-1"
        >
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${i === active ? 'bg-chapa' : ''}`}
            >
              {s.image && (
                <span className="relative w-11 h-9 shrink-0 rounded-[4px] border border-concreto bg-white overflow-hidden">
                  <Image src={s.image} alt="" fill sizes="44px" className="object-contain p-0.5" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-snug text-aco line-clamp-2">{s.label}</span>
                {s.sublabel && <span className="block text-xs text-aco-medio truncate">{s.sublabel}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
