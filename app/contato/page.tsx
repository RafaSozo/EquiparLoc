'use client';

import React, { useState } from 'react';
import { trackWhatsAppClick } from '@/lib/analytics';
import { FIELD_LIMITS as L } from '@/lib/form-limits';
import { SuggestInput } from '@/components/search/SuggestInput';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Locação de Equipamentos');
  const [equipment, setEquipment] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Registra o contato no CRM (mesma lista dos pedidos de orçamento)
      const res = await fetch('/api/orcamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          email,
          phone,
          equipmentName: equipment.trim() ? `${equipment.trim()} (Contato: ${subject})` : `Contato: ${subject}`,
          siteLocation: 'Informado via formulário de contato',
          message,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Não foi possível enviar a mensagem. Tente de novo ou ligue para (31) 3418-1500.');
        return;
      }
      setSent(true);
    } catch {
      setError('Sem conexão com o servidor. Verifique sua internet ou ligue para (31) 3418-1500.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    trackWhatsAppClick('Contato Geral', 'CONTACT_PAGE');
    window.open(
      'https://wa.me/5531991970322?text=Ol%C3%A1%20EquiparLoc!%20Estou%20entrando%20em%20contato%20pelo%20site%20para%20falar%20com%20o%20comercial.',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <main className="min-h-screen bg-chapa py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
            Fale com a EquiparLoc
          </h1>
          <p className="text-xs sm:text-sm text-aco-medio mt-2">
            Estamos prontos para atender suas necessidades de locação, agendamento de visitas técnicas ao pátio e suporte de emergência.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-concreto rounded-[6px] p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-2xl font-extrabold text-aco border-b border-concreto pb-3">
                Informações de Atendimento
              </h2>

              <ul className="space-y-4 text-xs text-aco-medio">
                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-[4px] bg-concreto text-aco shrink-0">
                    <MapPin className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <strong className="block text-aco font-semibold mb-0.5">Endereço</strong>
                    <address className="not-italic">Av. Elias Antônio Issa, 695<br />Candelária, Belo Horizonte - MG<br />CEP 31570-010</address>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Av.%20Elias%20Ant%C3%B4nio%20Issa%2C%20695%20-%20Candel%C3%A1ria%2C%20Belo%20Horizonte%20-%20MG%2C%20CEP%2031570-010"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-1 font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2"
                    >
                      Ver no mapa
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-[4px] bg-concreto text-aco shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-aco font-semibold mb-0.5">Telefones</strong>
                    <a href="tel:+553134181500" className="text-aco font-bold hover:text-laranja-texto">
                      (31) 3418-1500
                    </a>
                    <span className="block text-aco-medio mt-0.5">Telefone e WhatsApp</span>
                    <a href="https://wa.me/5531991970322" target="_blank" rel="noopener noreferrer" className="block mt-2 text-aco font-bold hover:text-laranja-texto">
                      (31) 99197-0322
                    </a>
                    <span className="block text-aco-medio mt-0.5">WhatsApp</span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-[4px] bg-concreto text-aco shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-aco font-semibold mb-0.5">E-mail Comercial</strong>
                    <a href="mailto:comercial@equiparloc.com.br" className="text-aco hover:text-laranja-texto">
                      comercial@equiparloc.com.br
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <div className="p-2 rounded-[4px] bg-concreto text-aco shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-aco font-semibold mb-0.5">Horário de Operação</strong>
                    <span>Segunda a Sexta: 07h30 às 18h00</span>
                    <span className="block text-liberado font-medium mt-0.5">Plantão técnico 24h para emergências em canteiro</span>
                  </div>
                </li>
              </ul>

              {/* WhatsApp direct card */}
              <div className="p-4 bg-chapa border border-concreto rounded-[6px] space-y-2">
                <span className="text-sm font-bold text-aco block">
                  Atendimento Instantâneo
                </span>
                <p className="text-sm text-aco-medio leading-relaxed">
                  Converse diretamente com o plantão de locações para consultar disponibilidade em tempo real.
                </p>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-aco border-2 border-aco hover:bg-aco hover:text-white rounded-[4px] transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chamar no WhatsApp Oficial</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Column (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-concreto rounded-[6px] p-6 sm:p-8 shadow-xs">
            {sent ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full border-2 border-liberado text-liberado mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-aco">
                  Mensagem Enviada com Sucesso!
                </h3>
                <p className="text-xs sm:text-sm text-aco-medio max-w-md mx-auto">
                  Agradecemos seu contato. Nossa equipe técnica analisará sua solicitação e retornará em breve no e-mail ou telefone informado.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="px-5 py-2 text-sm font-semibold text-aco underline underline-offset-4 decoration-laranja decoration-2"
                >
                  Enviar outra mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-2xl font-extrabold text-aco border-b border-concreto pb-3">
                  Envie uma Mensagem
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contato-campo-1" className="block text-xs font-semibold text-aco-medio mb-1">
                      Seu Nome *
                    </label>
                    <input
                      id="contato-campo-1"
                      type="text"
                      required
                      maxLength={L.name}
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Carlos Eduardo"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contato-campo-2" className="block text-xs font-semibold text-aco-medio mb-1">
                      Telefone com DDD *
                    </label>
                    <input
                      id="contato-campo-2"
                      type="tel"
                      required
                      maxLength={L.phone}
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 98765-4321"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contato-campo-3" className="block text-xs font-semibold text-aco-medio mb-1">
                      E-mail *
                    </label>
                    <input
                      id="contato-campo-3"
                      type="email"
                      required
                      maxLength={L.email}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@empresa.com.br"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500]"
                    />
                  </div>

                  <div>
                    <label htmlFor="contato-campo-4" className="block text-xs font-semibold text-aco-medio mb-1">
                      Assunto
                    </label>
                    <select
                      id="contato-campo-4"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-white"
                    >
                      <option value="Locação de Equipamentos">Locação de Equipamentos</option>
                      <option value="Dúvida Técnica de Dimensionamento">Dúvida Técnica de Dimensionamento</option>
                      <option value="Suporte e Manutenção em Campo">Suporte e Manutenção em Campo</option>
                      <option value="Financeiro e Faturamento">Financeiro e Faturamento</option>
                      <option value="Outro Assunto">Outro Assunto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contato-campo-equip" className="block text-xs font-semibold text-aco-medio mb-1">
                    Equipamento de interesse (opcional)
                  </label>
                  <SuggestInput
                    id="contato-campo-equip"
                    maxLength={L.equipment}
                    value={equipment}
                    onValueChange={setEquipment}
                    placeholder="Comece a digitar: betoneira, martelo, gerador..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="contato-campo-5" className="block text-xs font-semibold text-aco-medio mb-1">
                    Mensagem *
                  </label>
                  <textarea
                      id="contato-campo-5"
                    rows={4}
                    required
                    maxLength={L.message}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva brevemente como podemos ajudar..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#FF6500] resize-none"
                  />
                </div>

                {error && (
                  <p role="alert" className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-[4px]">
                    {error}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-aco-medio">
                    Resposta garantida em horário comercial.
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-aco bg-laranja hover:bg-laranja-escuro rounded-[4px] transition-colors shadow-xs disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Enviando...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Mensagem</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
