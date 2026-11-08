import path from 'path';

/**
 * Pasta onde o site guarda o banco (database.json), as fotos enviadas pelo painel e os backups.
 * Por padrão é `data/` dentro do projeto. Na hospedagem, defina a variável DATA_DIR com um
 * caminho fora da pasta do site, para que uma nova publicação não apague o que o cliente salvou.
 */
export const DATA_DIR = process.env.DATA_DIR?.trim()
  ? path.resolve(process.env.DATA_DIR.trim())
  : path.join(process.cwd(), 'data');
