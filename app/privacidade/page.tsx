import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Proteção de Dados (LGPD) | EquiparLoc',
  alternates: { canonical: '/privacidade' },
  description: 'Conheça nossa política de tratamento de dados pessoais e privacidade corporativa em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-concreto pb-6 space-y-2">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-aco leading-[0.95]">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-xs text-aco-medio">
            Última atualização: 31 de outubro de 2026, versão 1.2
          </p>
        </header>

        <section className="space-y-4 text-sm sm:text-base text-aco-medio leading-relaxed">
          <h2 className="text-xl font-bold text-aco">
            1. Introdução e Finalidade
          </h2>
          <p>
            A <strong>EQUIPAR Locação de Equipamentos Ltda.</strong> (CNPJ 57.309.078/0001-00) valoriza a privacidade e o controle sobre os dados de seus clientes, parceiros e usuários. Esta Política descreve como coletamos, tratamos, armazenamos e protegemos suas informações no âmbito da Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais – LGPD).
          </p>

          <h2 className="text-xl font-bold text-aco pt-4">
            2. Dados Coletados na Plataforma
          </h2>
          <p>
            Coletamos estritamente os dados necessários para o atendimento comercial e dimensionamento de propostas de locação:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-aco-medio">
            <li><strong>Dados de identificação e contato:</strong> Nome completo, telefone/WhatsApp, e-mail corporativo e nome da empresa ou razão social.</li>
            <li><strong>Dados de operação da obra:</strong> Município/local de mobilização do equipamento, período pretendido de locação e características técnicas do serviço.</li>
            <li><strong>Registros de navegação:</strong> Endereço IP, data e hora de acesso, tipo de dispositivo e páginas visitadas para fins analíticos anônimos e segurança contra fraudes.</li>
          </ul>

          <h2 className="text-xl font-bold text-aco pt-4">
            3. Finalidade e Base Legal do Tratamento
          </h2>
          <p>
            Os dados fornecidos são utilizados para:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-aco-medio">
            <li>Elaboração e envio de propostas comerciais de locação de máquinas pesadas (Execução de Contrato ou Procedimentos Preliminares – Art. 7º, V da LGPD).</li>
            <li>Comunicação operacional sobre logística de entrega, recolhimento e suporte mecânico em campo.</li>
            <li>Cumprimento de obrigações legais e fiscais (emissão de notas fiscais de locação e prestação de contas contábeis).</li>
          </ul>

          <h2 className="text-xl font-bold text-aco pt-4">
            4. Armazenamento Seguro e Não Compartilhamento
          </h2>
          <p>
            A EquiparLoc <strong>não comercializa, não aluga e não transfere</strong> seus dados pessoais a terceiros para fins de marketing. O acesso às solicitações no nosso CRM é restrito à equipe comercial e operacional diretamente envolvida na proposta.
          </p>

          <h2 className="text-xl font-bold text-aco pt-4">
            5. Direitos do Titular de Dados
          </h2>
          <p>
            Em conformidade com o Artigo 18 da LGPD, você possui o direito de solicitar a qualquer momento:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-aco-medio">
            <li>Confirmação da existência de tratamento e acesso aos dados.</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
            <li>Eliminação dos dados pessoais tratados mediante consentimento (ressalvadas obrigações legais de guarda fiscal).</li>
            <li>Revogação do consentimento para contatos comerciais.</li>
          </ul>

          <h2 className="text-xl font-bold text-aco pt-4">
            6. Canal do Encarregado de Dados (DPO)
          </h2>
          <p>
            Para exercer seus direitos ou esclarecer quaisquer dúvidas sobre o tratamento de seus dados, entre em contato com nosso Encarregado pelo e-mail:
          </p>
          <div className="p-4 bg-chapa border border-concreto rounded-[6px]">
            <strong className="block text-aco text-xs font-semibold">Encarregado de Proteção de Dados (DPO)</strong>
            <span className="text-xs text-aco-medio">comercial@equiparloc.com.br</span>
            <span className="block text-[11px] text-aco-medio mt-1">Atendimento de solicitações em até 15 dias úteis, conforme preconiza a legislação.</span>
          </div>
        </section>

        <footer className="pt-6 border-t border-concreto flex items-center justify-between text-xs text-aco-medio">
          <Link href="/" className="hover:text-aco transition-colors">
            ← Voltar para a Página Inicial
          </Link>
          <Link href="/contato" className="text-laranja-texto hover:underline font-semibold">
            Fale Conosco
          </Link>
        </footer>
      </div>
    </main>
  );
}
