'use client';

import React from 'react';
import { Instagram, Facebook, Linkedin, Youtube, Music2, MapPin } from 'lucide-react';
import { useCompany } from '@/lib/company-context';
import { socialList } from '@/lib/social';
import type { SocialId } from '@/lib/types';

const ICONS: Record<SocialId, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Music2,
  google: MapPin,
};

/** Ícones das redes sociais preenchidas em Dados da empresa. Some quando não há nenhuma. */
export function SocialLinks({ tone = 'dark', className = '' }: { tone?: 'dark' | 'light'; className?: string }) {
  const { socialLinks } = useCompany();
  const list = socialList(socialLinks);
  if (!list.length) return null;

  const btn =
    tone === 'dark'
      ? 'text-[#C6CDD3] border-[#3A4650] hover:text-white hover:border-[#FF6500]'
      : 'text-aco border-concreto hover:border-aco hover:bg-chapa';

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Redes sociais da EquiparLoc">
      {list.map((s) => {
        const Icon = ICONS[s.id];
        return (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={`${s.label} da EquiparLoc (abre em nova aba)`}
              title={s.label}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-[4px] border transition-colors ${btn}`}
            >
              <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
