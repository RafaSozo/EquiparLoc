import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { UPLOAD_CATALOG_DIR, CATALOG_NAME_RE } from '@/lib/catalog-media';

export const runtime = 'nodejs';

/** Entrega as fotos do catálogo enviadas pelo painel. O nome é validado para impedir acesso a outros arquivos. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;
  if (!CATALOG_NAME_RE.test(nome)) {
    return new NextResponse('Não encontrado', { status: 404 });
  }
  const file = path.join(UPLOAD_CATALOG_DIR, nome);
  if (!fs.existsSync(file)) {
    return new NextResponse('Não encontrado', { status: 404 });
  }
  return new NextResponse(fs.readFileSync(file), {
    headers: {
      'Content-Type': 'image/jpeg',
      // O nome tem um código aleatório: a foto nunca muda, pode ficar em cache por 1 ano
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
