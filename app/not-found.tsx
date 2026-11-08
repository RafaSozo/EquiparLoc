import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, PackageSearch, FileText, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Página não encontrada | EquiparLoc',
  robots: { index: false },
};

export default function NotFound() {
  const shortcuts = [
    {
      href: '/locacao',
      icon: PackageSearch,
      title: 'Locação de equipamentos',
      text: 'Compactadores, martelos, geradores e mais.',
    },
    {
      href: '/orcamento',
      icon: FileText,
      title: 'Solicitar orçamento',
      text: 'Receba uma proposta para a sua obra.',
    },
    {
      href: '/contato',
      icon: Phone,
      title: 'Fale conosco',
      text: 'Nossa equipe comercial ajuda você a encontrar.',
    },
  ];

  return (
    <main className="min-h-[70vh] bg-chapa flex items-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="type-display text-[5rem] text-aco" aria-hidden="true">404</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-aco leading-[0.95]">
          Não encontramos esta página
        </h1>
        <p className="text-sm text-aco-medio mt-3 max-w-lg mx-auto">
          O endereço pode ter mudado ou o equipamento não está mais disponível. Escolha um dos caminhos abaixo para continuar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
          {shortcuts.map(({ href, icon: Icon, title, text }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white border border-concreto rounded-[6px] p-4 hover:border-laranja hover:shadow-sm transition-all"
            >
              <Icon className="w-5 h-5 text-laranja mb-2" />
              <div className="text-sm font-bold text-aco group-hover:text-laranja-texto transition-colors">{title}</div>
              <div className="text-xs text-aco-medio mt-1">{text}</div>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-10 text-sm font-semibold text-aco-medio hover:text-laranja-texto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
