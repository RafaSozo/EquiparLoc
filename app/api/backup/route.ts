import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getDatabase } from '@/lib/db';
import { DATA_DIR } from '@/lib/data-dir';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Lista os arquivos de uma pasta (com subpastas), em caminhos relativos ao DATA_DIR. */
function listFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) out.push(...listFiles(full));
    else if (entry.isFile()) out.push(path.relative(DATA_DIR, full).split(path.sep).join('/'));
  }
  return out;
}

/**
 * Cópia de segurança completa para trocar de servidor: banco (produtos, categorias,
 * orçamentos, mensagens, configurações) e todas as fotos enviadas pelo painel.
 * Só o administrador. Contém dados pessoais de clientes: guardar com cuidado.
 * Para restaurar: node scripts/restaurar-copia.mjs <arquivo> <pasta-de-dados>
 */
export async function GET() {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  try {
    const files = listFiles(path.join(DATA_DIR, 'uploads')).map((rel) => ({
      path: rel,
      data: fs.readFileSync(path.join(DATA_DIR, rel)).toString('base64'),
    }));

    const body = JSON.stringify({
      format: 'equiparloc-backup',
      version: 1,
      createdAt: new Date().toISOString(),
      database: getDatabase(),
      files,
    });

    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="equiparloc-copia-${stamp}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar a cópia de segurança:', error);
    return NextResponse.json({ error: 'Não foi possível gerar a cópia de segurança.' }, { status: 500 });
  }
}
