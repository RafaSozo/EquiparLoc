import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getProductLines, saveProductLine, CategoryError } from '@/lib/db';
import type { ProductLine } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Linhas de produto (Máquinas pesadas, Ferramentas, Serviços...). */
export async function GET() {
  return NextResponse.json({ lines: getProductLines() });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth({ permission: 'fleet_create' });
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as Partial<ProductLine>;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Informe o nome da linha.' }, { status: 400 });
    }
    const { id: _ignored, ...data } = body;
    return NextResponse.json(saveProductLine({ ...data, name: body.name }), { status: 201 });
  } catch (error) {
    if (error instanceof CategoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao criar linha:', error);
    return NextResponse.json({ error: 'Erro ao criar a linha.' }, { status: 500 });
  }
}
