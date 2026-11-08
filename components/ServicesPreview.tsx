import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SERVICOS } from '@/lib/servicos';

/** Bloco "Serviços" da página inicial (mesma ordem do menu). */
export function ServicesPreview() {
  return (
    <section className="py-16 sm:py-24 bg-white border-b border-concreto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">Serviços</h2>
            <p className="text-base text-aco-medio mt-3 max-w-xl">
              Além da locação, fazemos o serviço com equipe e máquinas próprias.
            </p>
          </div>
          <Link
            href="/servicos"
            className="text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco whitespace-nowrap"
          >
            Ver os serviços
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICOS.map((s) => (
            <Link
              key={s.id}
              href={`/servicos#${s.id}`}
              className="group relative isolate overflow-hidden rounded-[6px] min-h-[18rem] flex items-end p-6 sm:p-8 text-white"
            >
              <Image
                src={s.imagem}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="-z-20 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(15,20,24,0.15)_0%,rgba(15,20,24,0.88)_75%)]"
              />
              <span>
                <span className="block type-display text-[2.25rem] sm:text-[2.75rem]">{s.nome}</span>
                <span className="block mt-2 text-sm text-[#D5DBE0] max-w-md">{s.resumo}</span>
                <span className="inline-block mt-4 text-sm font-bold underline underline-offset-4 decoration-laranja decoration-2">
                  Saiba mais
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
