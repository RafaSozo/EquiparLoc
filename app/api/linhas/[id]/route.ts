import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { saveProductLine, deleteProductLine, CategoryError } from '@/lib/db';
import type { ProductLine } from '@/lib/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAuth({ permission: 'fleet_edit' });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<ProductLine>;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Informe o nome da linha.' }, { status: 400 });
    }
    return NextResponse.json(saveProductLine({ ...body, id, name: body.name }));
  } catch (error) {
    if (error instanceof CategoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao salvar linha:', error);
    return NextResponse.json({ error: 'Erro ao salvar a linha.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  try {
    const { id } = await params;
    // Para qual linha vão as categorias da linha excluída
    deleteProductLine(id, req.nextUrl.searchParams.get('moverPara') || undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CategoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao excluir linha:', error);
    return NextResponse.json({ error: 'Erro ao excluir a linha.' }, { status: 500 });
  }
}
