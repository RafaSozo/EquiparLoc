import React from 'react';
import { Wrench, ShieldCheck, Truck, Radio } from 'lucide-react';

const differentials = [
  {
    icon: ShieldCheck,
    title: 'Laudos NR-11, NR-12 e NR-18 em dia',
    description:
      'Cada item sai do pátio com laudo de inspeção vigente, ART de manutenção e dispositivos de segurança testados.',
  },
  {
    icon: Wrench,
    title: 'Oficina própria',
    description:
      'Revisões preventivas pelo manual do fabricante. Menos máquina parada no meio do cronograma.',
  },
  {
    icon: Radio,
    title: 'Telemetria nas máquinas',
    description:
      'Acompanhamos horímetro, consumo e alertas à distância para antecipar a manutenção.',
  },
  {
    icon: Truck,
    title: 'Entrega com prancha adequada',
    description:
      'Rota planejada e transporte em prancha rebaixada para chegar no horário combinado.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 sm:py-24 bg-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
            Por que alugar com a EquiparLoc
          </h2>
          <p className="mt-4 text-base text-aco-medio leading-relaxed max-w-sm">
            Segurança no canteiro, documentação em ordem e entrega no prazo, em cada item da frota.
          </p>
        </div>

        <ul className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8">
          {differentials.map(({ icon: Icon, title, description }) => (
            <li key={title} className="border-t-2 border-aco pt-4">
              <Icon className="w-6 h-6 text-aco" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold text-aco">{title}</h3>
              <p className="mt-1.5 text-base text-aco-medio leading-relaxed">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
