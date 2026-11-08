import { notFound, permanentRedirect } from 'next/navigation';
import { getEquipmentBySlug } from '@/lib/db';
import { equipmentPath } from '@/lib/site';

// Endereço antigo: /catalogo/produto virou /locacao/grupo/produto
export default async function ProdutoAntigo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const equipment = getEquipmentBySlug(slug);
  if (!equipment || equipment.status !== 'active') notFound();
  permanentRedirect(equipmentPath(equipment));
}
