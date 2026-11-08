'use client';

import { FIELD_LIMITS as L } from '@/lib/form-limits';
import { SuggestInput } from '@/components/search/SuggestInput';
import { parsePeriod, periodLabel } from '@/lib/periodo';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackQuoteSubmission, trackWhatsAppClick } from '@/lib/analytics';
import { whatsappQuoteUrl, WHATSAPP_NUMBER } from '@/lib/whatsapp';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  FileCheck,
  Phone,
  MessageCircle,
} from 'lucide-react';

function StandaloneQuoteForm() {
  const searchParams = useSearchParams();
  const preEquipment = searchParams.get('equipamento') || '';
  // Período escolhido no calendário da página inicial (?retirada=AAAA-MM-DD&devolucao=AAAA-MM-DD)
  const prePeriod = parsePeriod(searchParams.get('retirada'), searchParams.get('devolucao'));
  const prePeriodLabel = prePeriod ? periodLabel(prePeriod.start, prePeriod.end) : '';

  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [equipmentName, setEquipmentName] = useState(preEquipment || '');
  const [siteLocation, setSiteLocation] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState(prePeriodLabel || 'Mensal (30 dias)');
  const [needsOperator, setNeedsOperator] = useState(false);
  const [needsTransport, setNeedsTransport] = useState(true);
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Informe um telefone válido com DDD.');
      return;
    }
    if (!siteLocation.trim()) {
      setError('Informe o município / local da obra.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          companyName,
          email,
          phone,
          equipmentName,
          rentalPeriod,
          siteLocation,
          needsOperator,
          needsTransport,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao registrar cotação.');
      }

      setSubmittedProtocol(data.protocol);
      trackQuoteSubmission(equipmentName, data.protocol);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    trackWhatsAppClick(equipmentName, 'ORCAMENTO_PAGE');
    const text = `Olá EquiparLoc! Acabei de enviar um pedido de cotação para ${equipmentName} (Protocolo: ${submittedProtocol || 'Site'}). Gostaria de agilizar a análise técnica.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Alternativa ao envio: abre o WhatsApp com o que já foi preenchido
  const handleWhatsAppInstead = () => {
    trackWhatsAppClick(equipmentName, 'ORCAMENTO_FORM');
    const url = whatsappQuoteUrl({ customerName, companyName, equipmentName, rentalPeriod, siteLocation, needsTransport, needsOperator, message });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (submittedProtocol) {
    return (
      <div className="bg-white border border-concreto rounded-[6px] p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full border-2 border-liberado text-liberado mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-aco-medio">
            Solicitação Confirmada no Sistema
          </span>
          <p className="text-3xl font-bold text-aco">
            {submittedProtocol}
          </p>
        </div>

        <p className="text-sm text-aco-medio leading-relaxed">
          Obrigado, <strong className="text-aco">{customerName}</strong>! Sua solicitação para locação de <strong className="text-aco">{equipmentName}</strong> foi enviada diretamente aos consultores comerciais da EquiparLoc.
        </p>

        <div className="p-4 bg-chapa rounded-[6px] text-left text-xs text-aco-medio space-y-2 max-w-md mx-auto border border-concreto">
          <div className="flex items-center gap-2 text-aco font-medium">
            <Clock className="w-4 h-4 text-laranja" />
            <span>Retorno comercial estimado: <strong>em até 2 horas úteis</strong></span>
          </div>
          <div className="flex items-center gap-2 text-aco font-medium">
            <FileCheck className="w-4 h-4 text-liberado" aria-hidden="true" />
            <span>Laudo técnico e minuta contratual enviados para seu e-mail</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-aco border-2 border-aco hover:bg-aco hover:text-white rounded-[4px] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Agilizar pelo WhatsApp Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => setSubmittedProtocol(null)}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-aco-medio bg-concreto hover:bg-[#D3D6D1] rounded-[6px] transition-colors"
          >
            Nova Solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Column (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-concreto rounded-[6px] p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-[4px]">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orcamento-campo-1" className="block text-xs font-semibold text-aco-medio mb-1">
                Nome do Responsável *
              </label>
              <input
                      id="orcamento-campo-1"
                type="text"
                required
                maxLength={L.name}
                    value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Mendes"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            <div>
              <label htmlFor="orcamento-campo-2" className="block text-xs font-semibold text-aco-medio mb-1">
                Razão Social / Nome da Empresa
              </label>
              <input
                      id="orcamento-campo-2"
                type="text"
                maxLength={L.company}
                    value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Construtora Exemplo Ltda."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orcamento-campo-3" className="block text-xs font-semibold text-aco-medio mb-1">
                E-mail Corporativo *
              </label>
              <input
                      id="orcamento-campo-3"
                type="email"
                required
                maxLength={L.email}
                    value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos@construtora.com.br"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            <div>
              <label htmlFor="orcamento-campo-4" className="block text-xs font-semibold text-aco-medio mb-1">
                Telefone com DDD / WhatsApp *
              </label>
              <input
                      id="orcamento-campo-4"
                type="tel"
                required
                maxLength={L.phone}
                    value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orcamento-campo-5" className="block text-xs font-semibold text-aco-medio mb-1">
                Equipamento Pretendido *
              </label>
              <SuggestInput
                id="orcamento-campo-5"
                required
                maxLength={L.equipment}
                value={equipmentName}
                onValueChange={setEquipmentName}
                placeholder="Comece a digitar: betoneira, martelo, gerador..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
              />
            </div>

            <div>
              <label htmlFor="orcamento-campo-6" className="block text-xs font-semibold text-aco-medio mb-1">
                Duração Estimada da Locação
              </label>
              <select
                      id="orcamento-campo-6"
                value={rentalPeriod}
                onChange={(e) => setRentalPeriod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-white"
              >
                {prePeriodLabel && <option value={prePeriodLabel}>{prePeriodLabel}</option>}
                <option value="Diária (1 a 5 dias)">Diária (1 a 5 dias)</option>
                <option value="Semanal (7 dias)">Semanal (7 dias)</option>
                <option value="Quinzenal (15 dias)">Quinzenal (15 dias)</option>
                <option value="Mensal (30 dias)">Mensal (30 dias)</option>
                <option value="Longo Prazo (> 6 meses)">Longo Prazo (&gt; 6 meses)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="orcamento-campo-7" className="block text-xs font-semibold text-aco-medio mb-1">
              Local da Obra (Município / UF / Endereço) *
            </label>
            <input
                      id="orcamento-campo-7"
              type="text"
              required
              maxLength={L.location}
                    value={siteLocation}
              onChange={(e) => setSiteLocation(e.target.value)}
              placeholder="Ex: cidade e endereço da obra"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2.5 border border-concreto rounded-[4px] cursor-pointer hover:bg-chapa">
              <input
                type="checkbox"
                checked={needsTransport}
                onChange={(e) => setNeedsTransport(e.target.checked)}
                className="w-4 h-4 text-laranja rounded border-slate-300 focus:ring-[#FF6500]"
              />
              <span className="text-xs text-aco-medio font-medium">
                Incluir frete / mobilização em prancha
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 border border-concreto rounded-[4px] cursor-pointer hover:bg-chapa">
              <input
                type="checkbox"
                checked={needsOperator}
                onChange={(e) => setNeedsOperator(e.target.checked)}
                className="w-4 h-4 text-laranja rounded border-slate-300 focus:ring-[#FF6500]"
              />
              <span className="text-xs text-aco-medio font-medium">
                Requer operador treinado e habilitado
              </span>
            </label>
          </div>

          <div>
            <label htmlFor="orcamento-campo-8" className="block text-xs font-semibold text-aco-medio mb-1">
              Detalhes Adicionais da Operação
            </label>
            <textarea
                      id="orcamento-campo-8"
              rows={3}
              maxLength={L.message}
                    value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Turnos de trabalho diário, tipo de material a ser escavado, necessidade de implementos específicos (rompedor, garfo pallet)..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] resize-none"
            />
          </div>

          <div className="pt-4 border-t border-concreto space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={handleWhatsAppInstead}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-aco border-2 border-aco hover:bg-aco hover:text-white rounded-[4px] transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#1FA855]" aria-hidden="true" />
                <span>Falar pelo WhatsApp</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <span>Enviando dados...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Enviar pedido de orçamento</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-aco-medio sm:text-right">
              No WhatsApp, a conversa já abre com o que você preencheu. Seus dados são tratados com sigilo profissional.
            </p>
          </div>
        </form>
      </div>

      {/* Sidebar Guidelines (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="placa bg-aco text-white px-7 py-6 space-y-3" style={{ ['--rebite' as string]: '#56626C' }}>
          <span className="text-sm font-semibold text-[#C6CDD3]">
            Garantias EquiparLoc
          </span>
          <h3 className="text-sm font-bold text-white">
            Contratos Transparentes Sem Surpresas
          </h3>
          <ul className="space-y-2 text-sm text-[#C6CDD3]">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-laranja shrink-0 mt-0.5" />
              <span>ART de manutenção preventiva emitida por engenheiro mecânico.</span>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-laranja shrink-0 mt-0.5" />
              <span>Substituição garantida em caso de imprevisto mecânico severo.</span>
            </li>
            <li className="flex items-start gap-2">
              <FileCheck className="w-4 h-4 text-laranja shrink-0 mt-0.5" />
              <span>Emissão ágil de nota fiscal e documentação para integração no canteiro.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-concreto rounded-[6px] p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-aco">
            <Phone className="w-4 h-4 text-laranja" />
            <span>Precisa de atendimento urgente?</span>
          </div>
          <p className="text-xs text-aco-medio leading-relaxed">
            Para mobilizações no mesmo dia ou emergências em subestações, fale com nossa central:
          </p>
          <div className="pt-1">
            <a
              href="tel:+553134181500"
              className="block text-sm font-bold text-aco hover:text-laranja-texto"
            >
              (31) 3418-1500
            </a>
            <span className="text-[11px] text-aco-medio">Plantão técnico 24 horas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StandaloneQuotePage() {
  return (
    <main className="min-h-screen bg-chapa py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="max-w-2xl mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
            Pedir orçamento
          </h1>
          <p className="text-xs sm:text-sm text-aco-medio mt-2">
            Preencha os dados da sua operação. Nossa engenharia analisa as demandas de solo, potência e logística para enviar uma proposta personalizada.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-aco-medio">Carregando formulário...</div>}>
          <StandaloneQuoteForm />
        </Suspense>
      </div>
    </main>
  );
}
