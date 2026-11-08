'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Clock, Lock } from 'lucide-react';
import { categoryPath } from '@/lib/site';
import type { SiteMenu } from '@/lib/types';

export function Footer({ menu }: { menu?: SiteMenu }) {
  const categories = menu?.categories || [];
  const services = menu?.services || [];
  return (
    <footer className="bg-aco text-[#C6CDD3] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4">
            <Link href="/" aria-label="EquiparLoc – página inicial" className="inline-flex">
              <Image
                src="/images/logo-equiparloc-branca.png"
                alt="EquiparLoc – Locações de Equipamentos"
                width={467}
                height={89}
                className="h-11 w-auto"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Locação de máquinas pesadas e ferramentas para obras civis e industriais.
            </p>
            <div className="text-xs text-[#9AA4AD]">
              CNPJ 57.309.078/0001-00
            </div>
          </div>

          {/* Mesma organização do menu */}
          <nav aria-label="Navegação do rodapé" className="space-y-3">
            <h2 className="text-base font-bold text-white [font-stretch:100%] tracking-normal">Empresa</h2>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-white transition-colors">Início</Link></li>
              <li><Link href="/empresa" className="hover:text-white transition-colors">Empresa</Link></li>
              {services.map((sv) => (
                <li key={sv.slug}>
                  <Link href={`/servicos#${sv.slug}`} className="hover:text-white transition-colors">{sv.name}</Link>
                </li>
              ))}
              <li><Link href="/localizacao" className="hover:text-white transition-colors">Localização</Link></li>
              <li><Link href="/contato" className="hover:text-white transition-colors">Fale conosco</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog: artigos técnicos</Link></li>
              <li><Link href="/orcamento" className="hover:text-white transition-colors">Pedir orçamento</Link></li>
            </ul>
          </nav>

          {/* Grupos de equipamentos (os mesmos do menu Locação) */}
          <nav aria-label="Locação" className="space-y-3">
            <h2 className="text-base font-bold text-white [font-stretch:100%] tracking-normal">
              <Link href="/locacao" className="hover:text-laranja transition-colors">Locação</Link>
            </h2>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.name}>
                  <Link href={categoryPath(c.name)} className="hover:text-white transition-colors">{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact Details */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white [font-stretch:100%] tracking-normal">
              Contato
            </h2>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF6500] shrink-0 mt-0.5" aria-hidden="true" />
                <address className="not-italic">Av. Elias Antônio Issa, 695<br />Candelária, Belo Horizonte - MG<br />CEP 31570-010</address>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF6500] shrink-0" />
                <a href="tel:+553134181500" className="hover:text-white transition-colors">
                  (31) 3418-1500
                </a>
                <span className="text-[#9AA4AD]">telefone e WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF6500] shrink-0" />
                <a href="https://wa.me/5531991970322" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  (31) 99197-0322
                </a>
                <span className="text-[#9AA4AD]">WhatsApp</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#FF6500] shrink-0" />
                <a href="mailto:comercial@equiparloc.com.br" className="hover:text-white transition-colors">
                  comercial@equiparloc.com.br
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-[#9AA4AD] shrink-0 mt-0.5" />
                <span>Segunda a Sexta: 08h às 17h | Suporte de Emergência 24h</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom hairline row */}
        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9AA4AD]">
          <div>
            © {new Date().getFullYear()} EQUIPAR Locação de Equipamentos Ltda. Todos os direitos reservados.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/privacidade" className="hover:text-slate-300 transition-colors">
              Política de Privacidade & LGPD
            </Link>
            <Link href="/contato" className="hover:text-slate-300 transition-colors">
              Fale Conosco
            </Link>
            {/* Acesso ao painel: nofollow para robôs não seguirem (a área já é noindex e bloqueada no robots.txt) */}
            <Link
              href="/admin"
              rel="nofollow"
              prefetch={false}
              className="hover:text-[#FF6500] transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Login</span>
            </Link>
          </div>
        </div>

        {/* Crédito da agência */}
        <div className="mt-6 flex justify-center sm:justify-end">
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
