import React from 'react';

// Aqui a numeração faz sentido: é uma sequência real de passos.
const steps = [
  {
    title: 'Encontre o item',
    description: 'Busque por nome ou filtre por categoria, peso ou tipo de motor no catálogo.',
  },
  {
    title: 'Confira a ficha técnica',
    description: 'Peso, alcance, consumo e dimensões para ter certeza de que serve na sua obra.',
  },
  {
    title: 'Peça o orçamento',
    description: 'Informe o local da obra e o período. Você recebe um número de protocolo na hora.',
  },
  {
    title: 'Receba a proposta',
    description: 'Nossa equipe retorna com valor, frete e data de entrega no canteiro.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-16 sm:py-24 bg-white border-b border-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95] max-w-xl">
          Como funciona a locação
        </h2>

        <ol className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="type-display block text-[4.5rem] text-aco" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-bold text-aco">{step.title}</h3>
              <p className="mt-1.5 text-base text-aco-medio leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
