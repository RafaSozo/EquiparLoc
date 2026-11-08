import path from 'path';
import { DATA_DIR } from './data-dir';

/** Fotos de equipamentos e categorias enviadas pelo painel (fora da pasta pública; servidas por /api/midia/catalogo). */
export const UPLOAD_CATALOG_DIR = path.join(DATA_DIR, 'uploads', 'catalogo');

/** Nome de arquivo aceito: gerado pelo servidor (letras, números e hífen) + .jpg */
export const CATALOG_NAME_RE = /^[a-z0-9][a-z0-9-]{2,90}\.jpg$/;

export const CATALOG_MEDIA_PREFIX = '/api/midia/catalogo/';
