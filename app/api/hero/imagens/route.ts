import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp, { type Metadata } from 'sharp';
import { requireAuth } from '@/lib/api-auth';
import { getHeroSettings } from '@/lib/db';
import { listHeroImages, UPLOAD_HERO_DIR, UPLOAD_NAME_RE } from '@/lib/hero';

export const runtime = 'nodejs';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MIN_WIDTH = 1200; // menor que isso fica borrado numa tela larga

/** Fotos disponíveis para a abertura. */
export async function GET() {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;
  return NextResponse.json({ images: listHeroImages() });
}

/**
 * Envio de foto (só administrador).
 * A foto é aberta e regravada pelo servidor (sharp): isso confirma que é mesmo uma imagem,
 * remove metadados (como localização do GPS) e descarta qualquer conteúdo escondido no arquivo.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  if (Number(req.headers.get('content-length') || 0) > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'A foto pode ter no máximo 8 MB.' }, { status: 413 });
  }

  try {
    const form = await req.formData();
    const file = form.get('foto');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Escolha uma foto para enviar.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'A foto pode ter no máximo 8 MB.' }, { status: 413 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    let meta: Metadata;
    try {
      meta = await sharp(input, { limitInputPixels: 50_000_000 }).metadata();
    } catch {
      return NextResponse.json({ error: 'O arquivo não é uma imagem válida.' }, { status: 400 });
    }
    if (!meta.format || !['jpeg', 'png', 'webp'].includes(meta.format)) {
      return NextResponse.json({ error: 'Envie uma foto JPG, PNG ou WEBP.' }, { status: 400 });
    }
    const width = meta.orientation && meta.orientation >= 5 ? meta.height : meta.width;
    if (!width || width < MIN_WIDTH) {
      return NextResponse.json(
        { error: `A foto precisa ter pelo menos ${MIN_WIDTH} px de largura para não ficar borrada (esta tem ${width || 0} px).` },
        { status: 400 }
      );
    }

    const output = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate() // aplica a rotação do celular antes de remover os metadados
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();

    const base =
      (file.name || 'foto')
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/, '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 50) || 'foto';
    const name = `${base}-${randomBytes(4).toString('hex')}.jpg`;

    fs.mkdirSync(UPLOAD_HERO_DIR, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(UPLOAD_HERO_DIR, name), output, { mode: 0o600 });

    return NextResponse.json({ image: { src: `/api/midia/hero/${name}`, name, uploaded: true } }, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar foto da abertura:', error);
    return NextResponse.json({ error: 'Não foi possível enviar a foto.' }, { status: 500 });
  }
}

/** Apaga uma foto enviada pelo painel (?nome=arquivo.jpg). A foto em uso não pode ser apagada. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  const name = new URL(req.url).searchParams.get('nome') || '';
  if (!UPLOAD_NAME_RE.test(name)) {
    return NextResponse.json({ error: 'Foto inválida.' }, { status: 400 });
  }
  if (getHeroSettings().image === `/api/midia/hero/${name}`) {
    return NextResponse.json({ error: 'Esta foto está na abertura do site. Escolha outra antes de apagar.' }, { status: 409 });
  }
  fs.rmSync(path.join(UPLOAD_HERO_DIR, name), { force: true });
  return NextResponse.json({ ok: true });
}
