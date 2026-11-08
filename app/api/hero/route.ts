import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getHeroSettings, saveHeroSettings } from '@/lib/db';
import { sanitizeHero } from '@/lib/hero';
import { readJsonLimited } from '@/lib/rate-limit';

/** Abertura da página inicial (público: só leitura). */
export async function GET() {
  return NextResponse.json(getHeroSettings());
}

/** Salva a abertura. Só o administrador. */
export async function PUT(req: NextRequest) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  const parsed = await readJsonLimited(req, 8 * 1024);
  if (parsed.error) return parsed.error;

  try {
    const saved = saveHeroSettings(sanitizeHero(parsed.body, getHeroSettings()));
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Erro ao salvar a abertura:', error);
    return NextResponse.json({ error: 'Não foi possível salvar a abertura.' }, { status: 500 });
  }
}
