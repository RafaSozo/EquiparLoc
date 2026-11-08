import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getCategoriesWithCount, saveCategory, CategoryError } from '@/lib/db';
import { Category } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ categories: getCategoriesWithCount() });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth({ permission: 'fleet_create' });
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as Partial<Category>;
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Informe o nome da categoria.' }, { status: 400 });
    }
    const { id: _ignored, ...data } = body;
    const created = saveCategory({ ...data, name: body.name });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof CategoryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ error: 'Erro ao criar categoria.' }, { status: 500 });
  }
}
