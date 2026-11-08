'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Dialog } from './ui/Dialog';
import { usePathname } from 'next/navigation';
import { useQuoteModal } from '@/lib/quote-modal-context';
import { Menu, X, ShieldCheck, Phone, Search, ChevronDown } from 'lucide-react';
import { FiboLiveSearch } from './search/FiboLiveSearch';
import { categoryPath } from '@/lib/site';
import type { SiteMenu } from '@/lib/types';

export type { MenuCategory } from '@/lib/types';

const EMPTY_MENU: SiteMenu = { lines: [], categories: [], services: [] };

type Dropdown = 'locacao' | 'servicos' | null;

// Ordem igual à do site antigo: Home, Empresa, Produtos (Locação), Serviços, Localização, Fale conosco
const NAV: { label: string; href: string; dropdown?: Exclude<Dropdown, null> }[] = [
  { label: 'Início', href: '/' },
  { label: 'Empresa', href: '/empresa' },
  { label: 'Locação', href: '/locacao', dropdown: 'locacao' },
  { label: 'Serviços', href: '/servicos', dropdown: 'servicos' },
  { label: 'Localização', href: '/localizacao' },
  { label: 'Fale conosco', href: '/contato' },
];

const PANEL_SPRING = { type: 'spring', bounce: 0, duration: 0.28 } as const;

export function Header({ menu = EMPTY_MENU }: { menu?: SiteMenu }) {
  const { categories, services } = menu;
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<Dropdown>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<Dropdown>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { openQuoteModal } = useQuoteModal();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fecha menus e busca ao trocar de página
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileMenuOpen(false);
    setSearchModalOpen(false);
    setOpenDropdown(null);
  }

  // Esc fecha tudo; menu do celular trava a rolagem do fundo
  useEffect(() => {
    if (!mobileMenuOpen && !openDropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (openDropdown && navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    const previousOverflow = document.body.style.overflow;
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [mobileMenuOpen, openDropdown]);

  // Painéis abrem ao passar o mouse (com pequena folga para não fechar no caminho) ou ao clicar
  const hoverOpen = (d: Dropdown) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(d);
  };
  const hoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 160);
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));

  const groups = menu.lines
    .map((line) => ({ group: line.id, name: line.name, items: categories.filter((c) => c.group === line.id) }))
    .filter((g) => g.items.length);
  const total = categories.reduce((n, c) => n + c.count, 0);

  return (
    <>
      {/* Barra superior */}
      <div className="bg-aco text-[#C6CDD3] text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6500]" />
            <span className="hidden sm:inline">Frota inspecionada com laudos NR-12 e NR-18 vigentes</span>
            <span className="sm:hidden">Equipamentos inspecionados</span>
          </span>
          <a href="tel:+553134181500" className="hover:text-white transition-colors flex items-center gap-1 text-slate-300 text-[11px]">
            <Phone className="w-3 h-3 text-[#FF6500]" />
            <span>(31) 3418-1500</span>
          </a>
        </div>
      </div>

      <header
        className={`header-material sticky top-0 z-40 w-full py-3 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_1px_0_rgba(27,34,40,0.06),0_8px_24px_-12px_rgba(27,34,40,0.18)]' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          <Link href="/" aria-label="EquiparLoc – página inicial" className="flex items-center shrink-0">
            <Image
              src="/images/logo-equiparloc.png"
              alt="EquiparLoc – Locações de Equipamentos"
              width={467}
              height={89}
              priority
              className="h-10 xl:h-11 w-auto"
            />
          </Link>

          {/* Menu principal (computador) */}
          <nav ref={navRef} aria-label="Menu principal" className="hidden lg:flex items-center gap-1 xl:gap-2 text-base font-semibold text-aco">
            {NAV.map((item) => {
              const active = isActive(item.href);
              const base = `relative flex items-center gap-1 px-2.5 py-2 rounded-[4px] whitespace-nowrap transition-colors hover:bg-concreto/70 ${
                active ? 'text-aco' : 'text-aco/85'
              }`;
              const underline = active && <span aria-hidden="true" className="absolute left-2.5 right-2.5 -bottom-0.5 h-[3px] bg-laranja rounded-full" />;

              if (!item.dropdown) {
                return (
                  <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={base}>
                    {item.label}
                    {underline}
                  </Link>
                );
              }

              const open = openDropdown === item.dropdown;
              const panelId = `menu-${item.dropdown}`;
              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => hoverOpen(item.dropdown!)}
                  onMouseLeave={hoverClose}
                >
                  <button
                    type="button"
                    className={base}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenDropdown(open ? null : item.dropdown!)}
                  >
                    {item.label}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                    {underline}
                  </button>

                  <AnimatePresence>
                    {open && (
                      <motion.div
                        id={panelId}
                        className={`absolute top-full pt-3 ${item.dropdown === 'locacao' ? 'left-1/2 -translate-x-1/2' : 'left-0'}`}
                        style={{ transformOrigin: 'top center' }}
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={PANEL_SPRING}
                      >
                        {item.dropdown === 'locacao' ? (
                          <div className="w-[min(40rem,calc(100vw-2rem))] bg-white rounded-[6px] border border-concreto shadow-[0_24px_48px_-16px_rgba(27,34,40,0.35)] p-5">
                            <div className="grid grid-cols-2 gap-6">
                              {groups.map(({ group, name, items }) => (
                                <div key={group}>
                                  <p className="px-2 mb-1.5 text-xs font-bold text-aco-medio">{name}</p>
                                  <ul>
                                    {items.map((c) => (
                                      <li key={c.name}>
                                        <Link
                                          href={categoryPath(c.name)}
                                          className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-[4px] text-[15px] font-semibold text-aco hover:bg-chapa hover:text-laranja-texto"
                                        >
                                          <span>{c.name}</span>
                                          <span className="text-xs font-medium text-aco-medio tabular-nums">{c.count}</span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-concreto flex items-center justify-between">
                              <Link href="/locacao" className="text-sm font-bold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:text-laranja-texto">
                                Ver toda a locação ({total} itens)
                              </Link>
                              <button type="button" onClick={() => openQuoteModal()} className="btn-acao px-3.5 py-2 text-sm">
                                Pedir orçamento
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="w-80 bg-white rounded-[6px] border border-concreto shadow-[0_24px_48px_-16px_rgba(27,34,40,0.35)] p-2">
                            {services.map((s) => (
                              <Link key={s.slug} href={`/servicos#${s.slug}`} className="block px-3 py-2.5 rounded-[4px] hover:bg-chapa group">
                                <span className="block text-[15px] font-semibold text-aco group-hover:text-laranja-texto">{s.name}</span>
                                {s.summary && (
                                  <span className="block text-xs font-normal text-aco-medio leading-snug mt-0.5">{s.summary}</span>
                                )}
                              </Link>
                            ))}
                            <Link href="/servicos" className="block px-3 py-2 text-sm font-bold text-laranja-texto">
                              Ver todos os serviços
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-2.5 text-aco hover:text-laranja-texto hover:bg-concreto/70 rounded-[4px] transition-colors"
              title="Buscar (Ctrl+K)"
              aria-label="Abrir busca"
            >
              <Search className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => openQuoteModal()} className="btn-acao px-4 xl:px-5 py-2.5 text-sm whitespace-nowrap">
              Pedir orçamento
            </button>
          </div>

          {/* Controles do celular e tablet */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="p-2 text-aco hover:text-laranja-texto rounded-[4px] hover:bg-concreto/70 transition-colors"
              aria-label="Abrir busca"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-aco rounded-[4px] hover:bg-concreto/70 transition-colors"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-mobile"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu do celular */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="menu-mobile"
              className="lg:hidden absolute inset-x-0 top-full max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-slate-200/70 bg-white px-4 pt-3 pb-6 shadow-[0_16px_32px_-16px_rgba(27,34,40,0.35)]"
              style={{ transformOrigin: '100% 0%' }}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            >
              <nav aria-label="Menu principal (celular)" className="flex flex-col">
                {NAV.map((item) => {
                  const active = isActive(item.href);
                  const cls = `flex items-center justify-between w-full px-3 py-3 text-base font-semibold rounded-[4px] ${
                    active ? 'text-laranja-texto bg-orange-50' : 'text-aco'
                  }`;
                  if (!item.dropdown) {
                    return (
                      <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cls}>
                        {item.label}
                      </Link>
                    );
                  }
                  const expanded = mobileSection === item.dropdown;
                  return (
                    <div key={item.href}>
                      <button
                        type="button"
                        className={cls}
                        aria-expanded={expanded}
                        onClick={() => setMobileSection(expanded ? null : item.dropdown!)}
                      >
                        {item.label}
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.ul
                            className="overflow-hidden pl-3 border-l-2 border-laranja ml-3 mb-2"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                          >
                            {item.dropdown === 'locacao' ? (
                              <>
                                {categories.map((c) => (
                                  <li key={c.name}>
                                    <Link href={categoryPath(c.name)} className="flex justify-between px-3 py-2 text-[15px] text-aco">
                                      <span>{c.name}</span>
                                      <span className="text-xs text-aco-medio">{c.count}</span>
                                    </Link>
                                  </li>
                                ))}
                                <li>
                                  <Link href="/locacao" className="block px-3 py-2 text-[15px] font-bold text-laranja-texto">
                                    Ver toda a locação
                                  </Link>
                                </li>
                              </>
                            ) : (
                              services.map((s) => (
                                <li key={s.slug}>
                                  <Link href={`/servicos#${s.slug}`} className="block px-3 py-2 text-[15px] text-aco">
                                    {s.name}
                                  </Link>
                                </li>
                              ))
                            )}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openQuoteModal();
                }}
                className="btn-acao w-full py-3 text-base mt-3"
              >
                Pedir orçamento
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Busca */}
        <Dialog open={searchModalOpen} onClose={() => setSearchModalOpen(false)} placement="top" label="Busca de equipamentos" panelClassName="max-w-2xl">
          <div className="flex items-center justify-between mb-2 text-white">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#FF6500]" />
              <span>Busca Inteligente EquiparLoc</span>
            </span>
            <button
              type="button"
              onClick={() => setSearchModalOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
              aria-label="Fechar busca"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <FiboLiveSearch mode="modal" isOpenModal={searchModalOpen} onCloseModal={() => setSearchModalOpen(false)} autoFocus />
        </Dialog>
      </header>
    </>
  );
}
