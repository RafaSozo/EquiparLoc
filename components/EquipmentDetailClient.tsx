'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Equipment } from '@/lib/types';
import { useQuoteModal } from '@/lib/quote-modal-context';
import { trackWhatsAppClick } from '@/lib/analytics';
import { EquipmentCard } from './EquipmentCard';
import { keySpec, isReadyToShip } from '@/lib/spec';
import { categoryPath } from '@/lib/site';
import {
  ShieldCheck,
  Check,
  ArrowRight,
  MessageSquare,
  Clock,
  ChevronRight,
  FileText,
  AlertCircle,
  Truck,
} from 'lucide-react';

interface EquipmentDetailClientProps {
  equipment: Equipment;
  relatedEquipments: Equipment[];
  /** Categoria principal, quando o item está numa subcategoria */
  parentCategoryName?: string;
}

/** Fotos de catálogo com fundo branco: mostrar inteiras, sem cortar */
const isCutout = (src: string) => src.startsWith('/images/produtos/');

export function EquipmentDetailClient({
  equipment,
  relatedEquipments,
  parentCategoryName,
}: EquipmentDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(equipment.image);
  const { openQuoteModal } = useQuoteModal();

  const handleWhatsApp = () => {
    trackWhatsAppClick(equipment.name, equipment.code);
    const text = `Olá EquiparLoc! Gostaria de mais informações e cotação de locação para o equipamento: ${equipment.name} (Cód: ${equipment.code}). Poderiam me atender?`;
    window.open(`https://wa.me/5531991970322?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const gallery = equipment.gallery && equipment.gallery.length ? equipment.gallery : [equipment.image];
  const spec = keySpec(equipment);
  const ready = isReadyToShip(equipment);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb (Anti-slop clean typography) */}
      <nav className="flex items-center gap-1.5 text-xs text-aco-medio mb-6" aria-label="Navegação estrutural">
        <Link href="/" className="hover:text-aco transition-colors">Início</Link>
        <ChevronRight className="w-3.5 h-3.5 text-aco-medio" />
        <Link href="/locacao" className="hover:text-aco transition-colors">Locação</Link>
        <ChevronRight className="w-3.5 h-3.5 text-aco-medio" />
        {parentCategoryName && (
          <>
            <Link href={categoryPath(parentCategoryName)} className="hover:text-aco transition-colors truncate">
              {parentCategoryName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-aco-medio" />
          </>
        )}
        <Link href={categoryPath(equipment.category)} className="hover:text-aco transition-colors truncate">
          {equipment.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-aco-medio" />
        <span className="text-aco font-medium truncate">{equipment.name}</span>
      </nav>

      {/* Main Showcase Top Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`relative w-full h-[320px] sm:h-[420px] rounded-[6px] overflow-hidden border border-concreto ${isCutout(selectedImage) ? 'bg-white' : 'bg-concreto'}`}>
            <Image
              src={selectedImage}
              alt={equipment.name}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className={isCutout(selectedImage) ? 'object-contain p-6' : 'object-cover'}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Thumbnails if multiple */}
          {gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {gallery.map((imgUrl, i) => (
                <button
                  key={`thumb-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={` relative w-20 h-16 rounded-[4px] overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === imgUrl ? 'border-laranja ring-2 ring-orange-200' : 'border-concreto opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={imgUrl}
                    alt={`${equipment.name} ângulo ${i + 1}`}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Essential Info Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-4">
            <p className="text-sm text-aco-medio">
              <span className="font-semibold text-aco">{equipment.code}</span> / {equipment.category}
            </p>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
              {equipment.name}
            </h1>

            <p className="text-base text-aco-medio leading-relaxed">
              {equipment.description}
            </p>

            {/* Quick Spec Highlights Strip */}
            <div className="placa px-6 py-5 bg-chapa border border-concreto">
              <div className="flex items-end justify-between gap-4 px-1 pb-4 mb-4 border-b border-concreto">
                <span className="text-sm text-aco-medio">{spec.label}</span>
                <span>
                  <span className="type-display text-[3.25rem] text-aco">{spec.value}</span>
                  <span className="ml-1 text-lg font-semibold text-aco-medio">{spec.unit}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm px-1">
              <div>
                <span className="text-aco-medio block text-xs">Peso operacional</span>
                <span className="font-bold text-aco">{equipment.specs.operatingWeight}</span>
              </div>
              <div>
                <span className="text-aco-medio block text-xs">Potência</span>
                <span className="font-bold text-aco">{equipment.specs.power}</span>
              </div>
              <div>
                <span className="text-aco-medio block text-xs">Combustível</span>
                <span className="font-bold text-aco">{equipment.specs.fuelType}</span>
              </div>
              <div>
                <span className="text-aco-medio block text-xs">Entrega</span>
                <span className={`font-bold ${ready ? 'text-liberado' : 'text-aco'}`}>{equipment.deliveryTime}</span>
              </div>
              </div>
            </div>

            {/* Trust and safety notice */}
            <div className="flex items-start gap-2.5 text-sm text-aco-medio">
              <ShieldCheck className="w-5 h-5 text-aco shrink-0" aria-hidden="true" />
              <span>{equipment.safetyNotes}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 border-t border-concreto space-y-2.5">
            <button
              type="button"
              onClick={() => openQuoteModal(equipment)}
              className="btn-acao w-full px-6 py-3.5 text-base"
            >
              Pedir orçamento deste item
            </button>

            {/* Exact prompt requirement: Botão de WhatsApp que monta a mensagem com nome e identificação */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-aco border-2 border-aco rounded-[4px] hover:bg-aco hover:text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              Conversar pelo WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Technical Specs & Applications Tabs */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Specifications Table (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-concreto rounded-[6px] p-6 sm:p-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95] mb-6">
            Ficha técnica
          </h2>

          <div className="divide-y divide-concreto text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-aco-medio font-medium">Peso Operacional</span>
              <span className="font-semibold text-aco">{equipment.specs.operatingWeight}</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-aco-medio font-medium">Potência do Motor</span>
              <span className="font-semibold text-aco">{equipment.specs.power}</span>
            </div>
            {equipment.specs.bucketCapacity && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-aco-medio font-medium">Capacidade da Caçamba / Carga</span>
                <span className="font-semibold text-aco">{equipment.specs.bucketCapacity}</span>
              </div>
            )}
            {equipment.specs.maxReach && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-aco-medio font-medium">Alcance Máximo Horizontal</span>
                <span className="font-semibold text-aco">{equipment.specs.maxReach}</span>
              </div>
            )}
            {equipment.specs.maxDigDepth && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-aco-medio font-medium">Profundidade / Altura de Trabalho</span>
                <span className="font-semibold text-aco">{equipment.specs.maxDigDepth}</span>
              </div>
            )}
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-aco-medio font-medium">Tipo de Combustível</span>
              <span className="font-semibold text-aco">{equipment.specs.fuelType}</span>
            </div>
            {equipment.specs.fuelTankCapacity && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-aco-medio font-medium">Capacidade do Tanque</span>
                <span className="font-semibold text-aco">{equipment.specs.fuelTankCapacity}</span>
              </div>
            )}
            {equipment.specs.dimensions && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-aco-medio font-medium">Dimensões de Transporte (C x L x A)</span>
                <span className="font-semibold text-aco">{equipment.specs.dimensions}</span>
              </div>
            )}
            {equipment.specs.additional &&
              Object.entries(equipment.specs.additional).map(([key, val]) => (
                <div key={key} className="py-2.5 flex items-center justify-between">
                  <span className="text-aco-medio font-medium">{key}</span>
                  <span className="font-semibold text-aco">{val}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Features & Applications (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Applications */}
          <div className="bg-white border border-concreto rounded-[6px] p-6 sm:p-8">
            <h3 className="text-lg font-bold text-aco mb-4">
              Onde usar
            </h3>
            <ul className="space-y-2.5 text-sm text-aco-medio">
              {equipment.applications.map((app, i) => (
                <li key={`app-${i}`} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-aco shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{app}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div className="bg-white border border-concreto rounded-[6px] p-6 sm:p-8">
            <h3 className="text-lg font-bold text-aco mb-4">
              Recursos do equipamento
            </h3>
            <ul className="space-y-2.5 text-sm text-aco-medio">
              {equipment.features.map((feat, i) => (
                <li key={`feat-${i}`} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-aco shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Logistics banner */}
          <div className="placa bg-aco text-white px-7 py-6 space-y-2" style={{ ['--rebite' as string]: '#56626C' }}>
            <div className="flex items-center gap-2 text-base font-bold">
              <Truck className="w-5 h-5" aria-hidden="true" />
              <span>Entrega no canteiro</span>
            </div>
            <p className="text-sm text-[#C6CDD3] leading-relaxed">
              Dispomos de frota própria de pranchas rebaixadas para levar e retirar o equipamento no canteiro. O frete é informado no orçamento.
            </p>
          </div>
        </div>
      </div>

      {/* Related Equipments Section */}
      {relatedEquipments.length > 0 && (
        <div className="mt-16 pt-12 border-t border-concreto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">
              Outros itens desta categoria
            </h2>
            <Link
              href={categoryPath(equipment.category)}
              className="text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2 hover:decoration-aco"
            >
              Ver todos em {equipment.category}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedEquipments.map((rel) => (
              <EquipmentCard key={rel.id} equipment={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
