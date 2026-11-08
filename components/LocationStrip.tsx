import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Navigation } from 'lucide-react';

/** Faixa "Localização" da página inicial. */
export function LocationStrip({ address, hours }: { address: string; hours: string }) {
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  return (
    <section className="bg-aco text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold leading-[0.95]">Localização</h2>
          <p className="mt-3 text-[#C6CDD3]">Retire no nosso pátio ou receba na obra.</p>
        </div>
        <div className="lg:col-span-5 space-y-3 text-[#D5DBE0]">
          <p className="flex gap-2.5">
            <MapPin className="w-5 h-5 text-laranja shrink-0 mt-0.5" aria-hidden="true" />
            <span>{address}</span>
          </p>
          <p className="flex gap-2.5">
            <Clock className="w-5 h-5 text-laranja shrink-0 mt-0.5" aria-hidden="true" />
            <span>{hours.split('|')[0].trim()}</span>
          </p>
        </div>
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-3">
          <a href={routeUrl} target="_blank" rel="noopener noreferrer" className="btn-acao px-5 py-3 text-sm">
            <Navigation className="w-4 h-4" aria-hidden="true" />
            Como chegar
          </a>
          <Link
            href="/localizacao"
            className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white border-2 border-white/70 rounded-[4px] hover:bg-white hover:text-aco transition-colors"
          >
            Ver mapa e contatos
          </Link>
        </div>
      </div>
    </section>
  );
}
