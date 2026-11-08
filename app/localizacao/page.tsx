import React from 'react';
import type { Metadata } from 'next';
import { MapPin, Clock, Phone, MessageCircle, Mail, Navigation } from 'lucide-react';
import { getCompanySettings } from '@/lib/db';
import { MapEmbed } from '@/components/MapEmbed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Localização | EquiparLoc – Locação de Máquinas e Ferramentas',
  alternates: { canonical: '/localizacao' },
  description:
    'Endereço, horário de funcionamento, mapa e telefones da EquiparLoc. Venha retirar seu equipamento ou fale com a gente pelo WhatsApp.',
};

function formatWhats(digits: string) {
  const d = digits.replace(/\D/g, '').replace(/^55/, '');
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : digits;
}

export default function LocalizacaoPage() {
  const s = getCompanySettings();
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.address)}`;
  const tel = `+55${s.phone.replace(/\D/g, '')}`;

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-concreto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">Onde estamos</h1>
          <p className="mt-4 text-base sm:text-lg text-aco-medio max-w-2xl leading-relaxed">
            Venha retirar o seu equipamento no nosso pátio ou peça a entrega na obra.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="flex gap-3">
            <MapPin className="w-5 h-5 text-laranja-texto shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-aco">Endereço</h2>
              <address className="not-italic text-base text-aco-medio leading-relaxed">{s.address}</address>
            </div>
          </div>

          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-laranja-texto shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-aco">Horário</h2>
              <p className="text-base text-aco-medio leading-relaxed">
                {s.businessHours.split('|').map((part) => (
                  <span key={part} className="block">
                    {part.trim()}
                  </span>
                ))}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Phone className="w-5 h-5 text-laranja-texto shrink-0 mt-1" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-aco">Contato</h2>
              <ul className="space-y-1.5 text-base">
                <li>
                  <a href={`tel:${tel}`} className="text-aco font-semibold hover:text-laranja-texto">
                    {s.phone}
                  </a>{' '}
                  <span className="text-sm text-aco-medio">telefone e WhatsApp</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-liberado" aria-hidden="true" />
                  <a
                    href={`https://wa.me/${s.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-aco font-semibold hover:text-laranja-texto"
                  >
                    {formatWhats(s.whatsapp)}
                  </a>
                  <span className="text-sm text-aco-medio">WhatsApp</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-aco-medio" aria-hidden="true" />
                  <a href={`mailto:${s.email}`} className="text-aco font-semibold hover:text-laranja-texto">
                    {s.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-acao px-6 py-3 text-base w-full sm:w-auto"
          >
            <Navigation className="w-4 h-4" aria-hidden="true" />
            Como chegar
          </a>
        </div>

        <div className="lg:col-span-7">
          <MapEmbed address={s.address} />
        </div>
      </section>
    </main>
  );
}
