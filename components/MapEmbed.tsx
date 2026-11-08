'use client';

import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

/**
 * Mapa do Google carregado só quando o visitante pede.
 * Assim a página abre mais rápido e o Google não recebe dados de quem não abriu o mapa (LGPD).
 */
export function MapEmbed({ address }: { address: string }) {
  const [loaded, setLoaded] = useState(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden rounded-[6px] border border-concreto bg-concreto">
      {loaded ? (
        <iframe
          src={src}
          title={`Mapa: ${address}`}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-aco bg-[repeating-linear-gradient(45deg,#E3E5E1_0_12px,#EBEDE9_12px_24px)] hover:bg-[#DDE0DB] transition-colors"
        >
          <span className="w-12 h-12 rounded-full bg-laranja flex items-center justify-center">
            <MapPin className="w-6 h-6 text-aco" aria-hidden="true" />
          </span>
          <span className="text-base font-bold">Mostrar o mapa</span>
          <span className="text-xs text-aco-medio max-w-xs text-center px-4">
            O mapa é do Google. Ao abrir, o Google pode registrar a sua visita.
          </span>
        </button>
      )}
    </div>
  );
}
