'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCompany } from '@/lib/company-context';
import { SocialLinks } from './SocialLinks';
import { addressLines, formatPhone, hoursParts, telHref, waHref } from '@/lib/company';
import { MapPin, Phone, Mail, Clock, Lock, MessageCircle } from 'lucide-react';
import { categoryPath } from '@/lib/site';
import type { SiteMenu } from '@/lib/types';

const linkCls = 'inline-block py-1 hover:text-white transition-colors';
const titleCls = 'text-base font-bold text-white [font-stretch:100%] tracking-normal mb-3';

/*
 * Rodapé
 * Celular: marca, contato, e os dois menus lado a lado.
 * Tablet: marca + contato numa linha, menus na outra.
 * Computador: 4 colunas (marca | empresa | locação em 2 colunas | contato).
 */
export function Footer({ menu }: { menu?: SiteMenu }) {
  const company = useCompany();
  const categories = menu?.categories || [];
  const services = menu?.services || [];
  const hours = hoursParts(company.businessHours);

  return (
    <footer className="bg-aco text-[#C6CDD3] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 lg:pt-14">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-10">
          {/* Marca */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3 space-y-4">
            <Link href="/" aria-label="EquiparLoc – página inicial" className="inline-flex">
              <Image
                src="/images/logo-equiparloc-branca.png"
                alt="EquiparLoc – Locações de Equipamentos"
                width={467}
                height={89}
                className="h-11 w-auto"
              />
            </Link>
            <p className="text-sm text-[#9AA4AD] leading-relaxed max-w-xs">
              Locação de máquinas pesadas e ferramentas para obras civis e industriais.
            </p>
            {company.cnpj && <p className="text-xs text-[#9AA4AD]">CNPJ {company.cnpj}</p>}
            <SocialLinks />
          </div>

          {/* Contato: no celular vem logo depois da marca */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3 lg:order-last">
            <h2 className={titleCls}>Contato</h2>
            <ul className="space-y-3">
              <li>
                <a href={telHref(company.phone)} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-[#FF6500] shrink-0" aria-hidden="true" />
                  <span>{company.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={waHref(company.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#FF6500] shrink-0" aria-hidden="true" />
                  <span>
                    {formatPhone(company.whatsapp)} <span className="text-[#9AA4AD]">WhatsApp</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${company.email}`} className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-[#FF6500] shrink-0" aria-hidden="true" />
                  <span className="break-all">{company.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#FF6500] shrink-0 mt-0.5" aria-hidden="true" />
                <address className="not-italic leading-relaxed">
                  {addressLines(company.address).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
              {hours.length > 0 && (
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#9AA4AD] shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="leading-relaxed">
                    {hours.map((h) => (
                      <span key={h} className="block">
                        {h}
                      </span>
                    ))}
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Empresa */}
          <nav aria-label="Navegação do rodapé" className="col-span-1 lg:col-span-2">
            <h2 className={titleCls}>Empresa</h2>
            <ul className="space-y-1">
              <li><Link href="/" className={linkCls}>Início</Link></li>
              <li><Link href="/empresa" className={linkCls}>Empresa</Link></li>
              {services.map((sv) => (
                <li key={sv.slug}>
                  <Link href={`/servicos#${sv.slug}`} className={linkCls}>{sv.name}</Link>
                </li>
              ))}
              <li><Link href="/localizacao" className={linkCls}>Localização</Link></li>
              <li><Link href="/contato" className={linkCls}>Fale conosco</Link></li>
              <li><Link href="/blog" className={linkCls}>Blog</Link></li>
              <li><Link href="/orcamento" className={linkCls}>Pedir orçamento</Link></li>
            </ul>
          </nav>

          {/* Locação: duas colunas no computador */}
          <nav aria-label="Locação" className="col-span-1 lg:col-span-4">
            <h2 className={titleCls}>
              <Link href="/locacao" className="hover:text-[#FF6500] transition-colors">Locação</Link>
            </h2>
            <ul className="space-y-1 lg:columns-2 lg:gap-x-6">
              {categories.map((c) => (
                <li key={c.name} className="break-inside-avoid">
                  <Link href={categoryPath(c.name)} className={linkCls}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Linha final */}
        <div className="mt-10 pt-6 border-t border-white/15 flex flex-col-reverse lg:flex-row items-center justify-between gap-4 text-xs text-[#9AA4AD] text-center lg:text-left">
          <p>© {new Date().getFullYear()} EQUIPAR Locação de Equipamentos Ltda. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacidade" className="py-1 hover:text-slate-300 transition-colors">
              Política de Privacidade &amp; LGPD
            </Link>
            <Link href="/contato" className="py-1 hover:text-slate-300 transition-colors">
              Fale Conosco
            </Link>
            {/* Acesso ao painel: nofollow para robôs não seguirem (a área já é noindex e bloqueada no robots.txt) */}
            <Link
              href="/admin"
              rel="nofollow"
              prefetch={false}
              className="py-1 hover:text-[#FF6500] transition-colors inline-flex items-center gap-1"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Login</span>
            </Link>
          </div>
        </div>

        {/* Crédito da agência */}
        <div className="mt-6 flex justify-center lg:justify-end">
          <a
            href="https://wa.me/5531983263133?text=Ol%C3%A1!%20Vi%20o%20site%20da%20EquiparLoc%20e%20quero%20falar%20sobre%20um%20projeto."
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group inline-flex items-center gap-3 text-xs text-[#9AA4AD] hover:text-white transition-colors"
            aria-label="Desenvolvido por Rafasozo Marketing e Design (abre o WhatsApp)"
          >
            <span>Desenvolvido por</span>
            <Image
              src="/images/rafasozo.png"
              alt=""
              width={120}
              height={38}
              className="h-[38px] w-auto opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
