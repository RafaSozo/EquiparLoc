'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Equipment } from '@/lib/types';
import { useQuoteModal } from '@/lib/quote-modal-context';
import { keySpec, isReadyToShip } from '@/lib/spec';
import { equipmentPath } from '@/lib/site';

interface EquipmentCardProps {
  equipment: Equipment;
}

/** Card no formato da plaqueta de identificação: foto, código, nome e o número que decide a escolha. */
export function EquipmentCard({ equipment }: EquipmentCardProps) {
  const { openQuoteModal } = useQuoteModal();
  const spec = keySpec(equipment);
  const ready = isReadyToShip(equipment);
  const href = equipmentPath(equipment);
  // Fotos de catálogo com fundo branco aparecem inteiras
  const cutout = equipment.image.startsWith('/images/produtos/');

  return (
    <article className="group flex flex-col bg-white border border-concreto rounded-[6px] overflow-hidden hover:border-aco transition-colors">
      <Link href={href} className={`block relative aspect-[4/3] overflow-hidden ${cutout ? 'bg-white' : 'bg-concreto'}`} tabIndex={-1} aria-hidden="true">
        <Image
          src={equipment.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 50vw, 100vw"
          className={cutout ? 'object-contain p-4' : 'object-cover'}
        />
      </Link>

      <div className="placa flex-1 flex flex-col px-5 pt-5 pb-5 bg-chapa border-t border-concreto">
        <div className="flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-aco-medio tracking-wide">{equipment.code}</span>
            <h3 className="mt-1 text-base font-bold text-aco leading-snug">
              <Link href={href} className="hover:underline underline-offset-4 decoration-laranja decoration-2">
                {equipment.name}
              </Link>
            </h3>
          </div>
          <div className="text-right shrink-0" title={spec.label}>
            <span className="type-display text-[2.25rem] text-aco">{spec.value}</span>
            <span className="ml-1 text-sm font-semibold text-aco-medio">{spec.unit}</span>
            <span className="block text-[11px] text-aco-medio">{spec.label}</span>
          </div>
        </div>

        <dl className="mt-4 px-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-aco-medio">Motor</dt>
          <dd className="text-aco truncate">{equipment.specs.fuelType}</dd>
          <dt className="text-aco-medio">Entrega</dt>
          <dd className={ready ? 'text-liberado font-semibold' : 'text-aco'}>{ready ? 'Pronta entrega' : 'Consulte o prazo'}</dd>
        </dl>

        <div className="mt-auto pt-5 px-1 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => openQuoteModal(equipment)}
            className="btn-acao w-full px-3 py-2.5 text-sm"
            aria-label={`Pedir orçamento: ${equipment.name}`}
          >
            Pedir orçamento
          </button>
          <Link
            href={href}
            className="text-sm font-semibold text-aco underline underline-offset-4 decoration-concreto decoration-2 hover:decoration-laranja"
          >
            Ver ficha técnica
          </Link>
        </div>
      </div>
    </article>
  );
}
