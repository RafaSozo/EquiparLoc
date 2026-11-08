'use client';

import { FIELD_LIMITS as L } from '@/lib/form-limits';
import { SuggestInput } from '@/components/search/SuggestInput';
import React, { useState } from 'react';
import { useQuoteModal } from '@/lib/quote-modal-context';
import { trackQuoteSubmission, trackWhatsAppClick } from '@/lib/analytics';
import { X, CheckCircle2, ShieldCheck, Clock, Send, MessageSquare, MessageCircle } from 'lucide-react';
import { whatsappQuoteUrl, WHATSAPP_NUMBER } from '@/lib/whatsapp';
import Image from 'next/image';
import { Dialog } from '@/components/ui/Dialog';

export function QuoteModal() {
  const { isOpen, closeQuoteModal, selectedEquipment } = useQuoteModal();

  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [rentalPeriod, setRentalPeriod] = useState('Mensal (30 dias)');
  const [needsOperator, setNeedsOperator] = useState(false);
  const [needsTransport, setNeedsTransport] = useState(true);
  const [equipmentText, setEquipmentText] = useState('');
  const [pickedId, setPickedId] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProtocol, setSubmittedProtocol] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    setSubmittedProtocol(null);
    closeQuoteModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um endereço de e-mail corporativo válido.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, informe um telefone de contato com DDD.');
      return;
    }
    if (!siteLocation.trim()) {
      setError('Por favor, informe o local / município da sua obra.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          companyName,
          email,
          phone,
          equipmentId: selectedEquipment?.id || pickedId,
          equipmentName: selectedEquipment ? selectedEquipment.name : equipmentText.trim() || 'Equipamento Sob Consulta',
          rentalPeriod,
          siteLocation,
          needsOperator,
          needsTransport,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação.');
      }

      setSubmittedProtocol(data.protocol);
      trackQuoteSubmission(selectedEquipment ? selectedEquipment.name : 'Equipamento Sob Consulta', data.protocol);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão. Tente novamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppRedirect = () => {
    const text = selectedEquipment
      ? `Olá EquiparLoc! Acabei de solicitar cotação para o equipamento ${selectedEquipment.name} (Protocolo: ${submittedProtocol || 'Novo'}). Gostaria de agilizar o atendimento com a equipe comercial.`
      : `Olá EquiparLoc! Gostaria de agilizar uma cotação de locação de maquinário pesado (Protocolo: ${submittedProtocol || 'Novo'}).`;

    trackWhatsAppClick(selectedEquipment?.name, selectedEquipment?.code);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Alternativa ao envio: abre o WhatsApp com o que já foi preenchido
  const handleWhatsAppInstead = () => {
    const equipmentName = selectedEquipment ? `${selectedEquipment.name} (${selectedEquipment.code})` : equipmentText;
    trackWhatsAppClick(selectedEquipment?.name || equipmentText, selectedEquipment?.code || 'MODAL_FORM');
    const url = whatsappQuoteUrl({ customerName, companyName, equipmentName, rentalPeriod, siteLocation, needsTransport, needsOperator, message });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      sheetOnMobile
      label="Pedir orçamento"
      panelClassName="max-w-2xl bg-white border border-concreto rounded-[6px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-aco text-white border-b border-slate-800">
          <div>
            <span className="text-xs text-[#C6CDD3] font-semibold">
              Resposta em horário comercial
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white">
              {submittedProtocol ? 'Pedido de orçamento enviado' : 'Pedir orçamento'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-aco-medio hover:text-white rounded-[4px] hover:bg-slate-800 transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto">
          {submittedProtocol ? (
            <div className="py-6 text-center space-y-5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-liberado text-liberado mb-2">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-aco-medio">
                  Protocolo Oficial de Atendimento
                </span>
                <p className="text-2xl font-bold text-aco">
                  {submittedProtocol}
                </p>
              </div>

              <p className="text-sm text-aco-medio max-w-md mx-auto leading-relaxed">
                Sua solicitação para <strong className="text-aco">{selectedEquipment ? selectedEquipment.name : 'Equipamento'}</strong> foi registrada em nosso CRM. Nossa equipe técnica já está preparando a proposta com disponibilidade e logística.
              </p>

              <div className="p-4 bg-chapa border border-concreto rounded-[4px] text-left text-xs text-aco-medio space-y-1.5 max-w-md mx-auto">
                <div className="flex items-center gap-2 font-medium text-aco">
                  <Clock className="w-4 h-4 text-laranja" />
                  <span>Tempo médio de resposta comercial: <strong>até 2 horas úteis</strong></span>
                </div>
                <div className="flex items-center gap-2 font-medium text-aco">
                  <ShieldCheck className="w-4 h-4 text-liberado" aria-hidden="true" />
                  <span>Equipamento revisado com laudos NR-11/12/18 vigentes</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleWhatsAppRedirect}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-aco border-2 border-aco hover:bg-aco hover:text-white rounded-[4px] transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Falar agora pelo WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-aco-medio bg-concreto hover:bg-[#D3D6D1] rounded-[4px] transition-colors"
                >
                  Concluir e Voltar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Equipment Highlight if selected */}
              {selectedEquipment && (
                <div className="flex items-center gap-3 p-3 bg-chapa border border-concreto rounded-[4px]">
                  <div className="relative w-16 h-12 bg-slate-200 rounded overflow-hidden shrink-0">
                    <Image
                      src={selectedEquipment.image}
                      alt={selectedEquipment.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-aco-medio">
                      <span className="text-laranja-texto font-semibold">{selectedEquipment.code}</span>
                      <span aria-hidden="true">/</span>
                      <span className="truncate">{selectedEquipment.category}</span>
                    </div>
                    <h4 className="text-sm font-bold text-aco truncate">
                      {selectedEquipment.name}
                    </h4>
                  </div>
                </div>
              )}

              {!selectedEquipment && (
                <div>
                  <label htmlFor="modal-orcamento-equip" className="block text-xs font-semibold text-aco-medio mb-1">
                    Equipamento *
                  </label>
                  <SuggestInput
                    id="modal-orcamento-equip"
                    required
                    maxLength={L.equipment}
                    value={equipmentText}
                    onValueChange={(v) => {
                      setEquipmentText(v);
                      setPickedId('');
                    }}
                    onSuggestionSelect={(s) => setPickedId(s.id)}
                    placeholder="Comece a digitar: betoneira, martelo, gerador..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-[4px]">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-orcamento-campo-1" className="block text-xs font-semibold text-aco-medio mb-1">
                    Nome Completo *
                  </label>
                  <input
                      id="modal-orcamento-campo-1"
                    type="text"
                    required
                    maxLength={L.name}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Mendes"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="modal-orcamento-campo-2" className="block text-xs font-semibold text-aco-medio mb-1">
                    Empresa / Construtora
                  </label>
                  <input
                      id="modal-orcamento-campo-2"
                    type="text"
                    maxLength={L.company}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Construtora Exemplo Ltda."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-orcamento-campo-3" className="block text-xs font-semibold text-aco-medio mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                      id="modal-orcamento-campo-3"
                    type="email"
                    required
                    maxLength={L.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com.br"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="modal-orcamento-campo-4" className="block text-xs font-semibold text-aco-medio mb-1">
                    Telefone / WhatsApp com DDD *
                  </label>
                  <input
                      id="modal-orcamento-campo-4"
                    type="tel"
                    required
                    maxLength={L.phone}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-orcamento-campo-5" className="block text-xs font-semibold text-aco-medio mb-1">
                    Local da Obra (Cidade / UF) *
                  </label>
                  <input
                      id="modal-orcamento-campo-5"
                    type="text"
                    required
                    maxLength={L.location}
                    value={siteLocation}
                    onChange={(e) => setSiteLocation(e.target.value)}
                    placeholder="Ex: cidade e endereço da obra"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="modal-orcamento-campo-6" className="block text-xs font-semibold text-aco-medio mb-1">
                    Período Previsto de Locação
                  </label>
                  <select
                      id="modal-orcamento-campo-6"
                    value={rentalPeriod}
                    onChange={(e) => setRentalPeriod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent bg-white"
                  >
                    <option value="Diária (1 a 5 dias)">Diária (1 a 5 dias)</option>
                    <option value="Semanal (7 dias)">Semanal (7 dias)</option>
                    <option value="Quinzenal (15 dias)">Quinzenal (15 dias)</option>
                    <option value="Mensal (30 dias)">Mensal (30 dias)</option>
                    <option value="Longo Prazo (> 6 meses)">Longo Prazo (&gt; 6 meses)</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes for transport and operator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 border border-concreto rounded-[4px] cursor-pointer hover:bg-chapa transition-colors">
                  <input
                    type="checkbox"
                    checked={needsTransport}
                    onChange={(e) => setNeedsTransport(e.target.checked)}
                    className="w-4 h-4 text-laranja rounded border-slate-300 focus:ring-[#FF6500]"
                  />
                  <span className="text-xs text-aco-medio font-medium">
                    Incluir mobilização / frete em prancha
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 border border-concreto rounded-[4px] cursor-pointer hover:bg-chapa transition-colors">
                  <input
                    type="checkbox"
                    checked={needsOperator}
                    onChange={(e) => setNeedsOperator(e.target.checked)}
                    className="w-4 h-4 text-laranja rounded border-slate-300 focus:ring-[#FF6500]"
                  />
                  <span className="text-xs text-aco-medio font-medium">
                    Necessito de operador qualificado
                  </span>
                </label>
              </div>

              <div>
                <label htmlFor="modal-orcamento-campo-7" className="block text-xs font-semibold text-aco-medio mb-1">
                  Observações Técnicas ou Aplicação da Obra
                </label>
                <textarea
                      id="modal-orcamento-campo-7"
                  rows={2}
                  maxLength={L.message}
                    value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Informações adicionais sobre turno de trabalho, tipo de solo, altura necessária ou cronograma..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] focus:border-transparent resize-none"
                />
              </div>

              <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-concreto">
                <div className="text-[11px] text-aco-medio">
                  Dados protegidos pela LGPD. Não enviamos spam.
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleWhatsAppInstead}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-aco border-2 border-aco hover:bg-aco hover:text-white rounded-[4px] transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-[#1FA855]" aria-hidden="true" />
                    <span>Falar pelo WhatsApp</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Registrando...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar pedido de orçamento</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
    </Dialog>
  );
}
