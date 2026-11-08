import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { saveCategory, deleteCategory, CategoryError } from '@/lib/db';
import { Category } from '@/lib/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth({ permission: 'fleet_edit' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<Category>;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Informe o nome da categoria.' }, { status: 400 });
    }
    const updated = saveCategory({ ...body, id, name: body.name });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof CategoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    // Para onde vão os itens da categoria excluída (nome de outra categoria)
    const moveTo = req.nextUrl.searchParams.get('moverPara') || undefined;
    deleteCategory(id, moveTo);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CategoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria.' }, { status: 500 });
  }
}
