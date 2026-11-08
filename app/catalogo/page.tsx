import { permanentRedirect } from 'next/navigation';
import { categoryPath } from '@/lib/site';

// Endereço antigo: /catalogo virou /locacao (e ?cat=Grupo virou /locacao/grupo)
interface Props {
  searchParams: Promise<{ cat?: string; q?: string; tipo?: string }>;
}

export default async function CatalogoAntigo({ searchParams }: Props) {
  const { cat, q, tipo } = await searchParams;
  if (cat && cat !== 'Todas') permanentRedirect(categoryPath(cat));
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (tipo) params.set('tipo', tipo);
  const qs = params.toString();
  permanentRedirect(qs ? `/locacao?${qs}` : '/locacao');
}
