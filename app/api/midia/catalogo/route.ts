import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp, { type Metadata } from 'sharp';
import { requireAuth } from '@/lib/api-auth';
import { UPLOAD_CATALOG_DIR, CATALOG_MEDIA_PREFIX } from '@/lib/catalog-media';

export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB (fotos de celular)
const MIN_WIDTH = 500; // menor que isso fica borrado na página do equipamento

/**
 * Envio de foto do catálogo (equipamentos e categorias).
 * O servidor abre e regrava a foto: confirma que é imagem, corrige a rotação do celular,
 * reduz para no máximo 1600 px, remove metadados (como a localização do GPS) e grava em JPG.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth({ permission: 'fleet_edit' });
  if (auth.error) return auth.error;

  if (Number(req.headers.get('content-length') || 0) > MAX_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'A foto pode ter no máximo 12 MB.' }, { status: 413 });
  }

  try {
    const form = await req.formData();
    const file = form.get('foto');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Escolha uma foto para enviar.' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'A foto pode ter no máximo 12 MB.' }, { status: 413 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    let meta: Metadata;
    try {
      meta = await sharp(input, { limitInputPixels: 60_000_000 }).metadata();
    } catch {
      return NextResponse.json({ error: `"${file.name}" não é uma imagem válida.` }, { status: 400 });
    }
    if (!meta.format || !['jpeg', 'png', 'webp', 'heif', 'avif'].includes(meta.format)) {
      return NextResponse.json({ error: `"${file.name}": envie fotos JPG, PNG ou WEBP.` }, { status: 400 });
    }
    const width = meta.orientation && meta.orientation >= 5 ? meta.height : meta.width;
    if (!width || width < MIN_WIDTH) {
      return NextResponse.json(
        { error: `"${file.name}" é pequena demais (${width || 0} px). Use fotos com pelo menos ${MIN_WIDTH} px de largura.` },
        { status: 400 }
      );
    }

    const output = await sharp(input, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // PNG com fundo transparente vira fundo branco
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    const hint = String(form.get('nome') || file.name || 'foto');
    const base =
      hint
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/, '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'foto';
    const name = `${/^[a-z0-9]/.test(base) ? base : `foto-${base}`}-${randomBytes(4).toString('hex')}.jpg`;

    fs.mkdirSync(UPLOAD_CATALOG_DIR, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(UPLOAD_CATALOG_DIR, name), output, { mode: 0o600 });

    return NextResponse.json({ src: `${CATALOG_MEDIA_PREFIX}${name}` }, { status: 201 });
  } catch (error) {
    console.error('Erro ao enviar foto do catálogo:', error);
    return NextResponse.json({ error: 'Não foi possível enviar a foto.' }, { status: 500 });
  }
}
