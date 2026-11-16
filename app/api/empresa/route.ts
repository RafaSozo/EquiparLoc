import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAboutPage, saveAboutPage } from '@/lib/db';
import { sanitizeAbout } from '@/lib/about';
import { readJsonLimited } from '@/lib/rate-limit';

/** Conteúdo da página Empresa (público: só leitura). */
export async function GET() {
  return NextResponse.json(getAboutPage());
}

/** Salva a página Empresa. Só o administrador. */
export async function PUT(req: NextRequest) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  const parsed = await readJsonLimited(req, 32 * 1024);
  if (parsed.error) return parsed.error;

  try {
    return NextResponse.json(saveAboutPage(sanitizeAbout(parsed.body)));
  } catch (error) {
    console.error('Erro ao salvar a página Empresa:', error);
    return NextResponse.json({ error: 'Não foi possível salvar a página Empresa.' }, { status: 500 });
  }
}
