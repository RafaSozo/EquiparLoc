import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, optionalAuth } from '@/lib/api-auth';
import { getAllEquipments, saveEquipment } from '@/lib/db';
import { Equipment } from '@/lib/types';
import { pickEquipmentFields, uniqueSlug } from '@/lib/equipment-input';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const featured = searchParams.get('featured');

    let list = getAllEquipments();
    // Rascunhos só aparecem para quem está logado no painel
    if (!(await optionalAuth())) list = list.filter((eq) => eq.status === 'active');

    if (category && category !== 'Todas') {
      list = list.filter((eq) => eq.category === category);
    }

    if (featured === 'true') {
      list = list.filter((eq) => eq.isFeatured);
    }

    if (search) {
      list = list.filter(
        (eq) =>
          eq.name.toLowerCase().includes(search) ||
          eq.code.toLowerCase().includes(search) ||
          eq.summary.toLowerCase().includes(search) ||
          eq.specs.power.toLowerCase().includes(search) ||
          eq.specs.operatingWeight.toLowerCase().includes(search) ||
          eq.category.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ equipments: list, total: list.length });
  } catch (error) {
    console.error('Error fetching equipments:', error);
    return NextResponse.json({ error: 'Failed to fetch equipments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth({ permission: 'fleet_create' });
  if (auth.error) return auth.error;

  try {
    // Só os campos conhecidos; o id é sempre gerado pelo servidor (não sobrescreve um existente)
    const body = pickEquipmentFields(await req.json()) as Equipment;
    if (!body.name || !body.category) {
      return NextResponse.json({ error: 'Nome e categoria são obrigatórios' }, { status: 400 });
    }

    const id = `eq-${Date.now()}`;
    const slug = uniqueSlug(body.slug || body.name, getAllEquipments(), id);
    const code = body.code || `EQ-${Math.floor(100 + Math.random() * 900)}`;

    const newEquipment: Equipment = {
      ...body,
      id,
      slug,
      code,
      status: body.status || 'active',
      gallery: body.gallery && body.gallery.length ? body.gallery : [body.image || '/images/hero/hero-miniescavadeira.jpg'],
      image: body.image || '/images/hero/hero-miniescavadeira.jpg',
    };

    const saved = saveEquipment(newEquipment);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar equipamento' }, { status: 500 });
  }
}
