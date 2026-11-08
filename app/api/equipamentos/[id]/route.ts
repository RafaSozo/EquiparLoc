import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, optionalAuth } from '@/lib/api-auth';
import { getEquipmentById, getAllEquipments, saveEquipment, deleteEquipment } from '@/lib/db';
import { Equipment } from '@/lib/types';
import { pickEquipmentFields, uniqueSlug } from '@/lib/equipment-input';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = getEquipmentById(id);
    if (!item || (item.status !== 'active' && !(await optionalAuth()))) {
      return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ permission: 'fleet_edit' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    // Só os campos conhecidos do equipamento (o id nunca muda)
    const body = pickEquipmentFields(await req.json());
    const existing = getEquipmentById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
    }

    const updated: Equipment = {
      ...existing,
      ...body,
      id,
    };
    // Endereço da página: nunca vazio e nunca igual ao de outro equipamento
    if (body.slug !== undefined) updated.slug = uniqueSlug(body.slug || updated.name, getAllEquipments(), id);

    const saved = saveEquipment(updated);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Erro ao atualizar equipamento' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const success = deleteEquipment(id);
    if (!success) {
      return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Equipamento excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Erro ao excluir equipamento' }, { status: 500 });
  }
}
