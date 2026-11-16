#!/usr/bin/env node
/*
 * Restaura a cópia de segurança baixada no painel (Dados da empresa > Baixar cópia de segurança)
 * numa pasta de dados nova. Uso no servidor:
 *
 *   node scripts/restaurar-copia.mjs equiparloc-copia-AAAA-MM-DD-HH-MM.json /var/lib/equiparloc
 *
 * Se a pasta já tiver um banco, ele NÃO é apagado: o script para. Para trocar mesmo assim,
 * acrescente --substituir (o banco atual é guardado como database.json.antes-restauracao).
 * Pare o site antes de restaurar e ligue depois.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const replace = args.includes('--substituir');
const [file, dataDir] = args.filter((a) => !a.startsWith('--'));

if (!file || !dataDir) {
  console.error('Uso: node scripts/restaurar-copia.mjs <arquivo-da-copia.json> <pasta-de-dados> [--substituir]');
  process.exit(1);
}

const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
if (backup?.format !== 'equiparloc-backup' || backup.version !== 1 || !backup.database || !Array.isArray(backup.files)) {
  console.error('Este arquivo não é uma cópia de segurança da EquiparLoc.');
  process.exit(1);
}
const db = backup.database;
if (!Array.isArray(db.equipments) || !Array.isArray(db.quotes)) {
  console.error('A cópia está incompleta (faltam produtos ou orçamentos). Nada foi alterado.');
  process.exit(1);
}

const root = path.resolve(dataDir);
const dbPath = path.join(root, 'database.json');
fs.mkdirSync(root, { recursive: true, mode: 0o700 });

if (fs.existsSync(dbPath)) {
  if (!replace) {
    console.error(`Já existe um banco em ${dbPath}. Nada foi alterado. Use --substituir para trocar.`);
    process.exit(1);
  }
  fs.copyFileSync(dbPath, `${dbPath}.antes-restauracao`);
  console.log(`Banco anterior guardado em ${dbPath}.antes-restauracao`);
}

// Fotos: só dentro de uploads/, sem caminhos que saiam da pasta
const uploadsRoot = path.join(root, 'uploads') + path.sep;
let written = 0;
for (const f of backup.files) {
  const rel = String(f.path || '');
  const target = path.resolve(root, rel);
  if (!rel.startsWith('uploads/') || !target.startsWith(uploadsRoot)) {
    console.warn(`Ignorado (caminho fora de uploads/): ${rel}`);
    continue;
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, Buffer.from(String(f.data || ''), 'base64'));
  written += 1;
}

// Banco por último: grava num arquivo temporário e troca de uma vez
const tmp = `${dbPath}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
fs.renameSync(tmp, dbPath);

console.log(
  `Pronto: ${db.equipments.length} produtos, ${db.categories?.length ?? 0} categorias, ` +
    `${db.quotes.length} orçamentos, ${(db.contactMessages || []).length} mensagens e ${written} fotos restaurados em ${root}.`
);
console.log(`Cópia feita em: ${backup.createdAt}`);
