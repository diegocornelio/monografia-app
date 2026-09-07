// cobertura.mjs — varre todos os arquivos de teste, coleta os identificadores
// de feature (F001 a F096) e prova que nenhuma feature do catalogo do §7 do
// planejamento ficou sem teste em algum nivel.
//
// Uso: node testes/cobertura.mjs
// Falha com codigo 1 se alguma feature ficar descoberta, e e esse o portao que
// impede o catalogo de crescer sem especificacao correspondente.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TOTAL_FEATURES = 99;

const NIVEIS = [
  { nome: 'especificacao', pasta: join(AQUI, 'especificacao'), sufixo: '.spec.mjs' },
  { nome: 'e2e', pasta: join(AQUI, 'e2e'), sufixo: '.spec.ts' },
  { nome: 'unidade', pasta: AQUI, sufixo: '.test.mjs' },
];

const porFeature = new Map();

for (const nivel of NIVEIS) {
  let arquivos = [];
  try {
    arquivos = (await readdir(nivel.pasta)).filter((a) => a.endsWith(nivel.sufixo));
  } catch {
    continue;
  }
  for (const arquivo of arquivos) {
    const conteudo = await readFile(join(nivel.pasta, arquivo), 'utf8');
    for (const id of conteudo.match(/F0\d{2}/g) ?? []) {
      const atual = porFeature.get(id) ?? new Set();
      atual.add(nivel.nome);
      porFeature.set(id, atual);
    }
  }
}

const descobertas = [];
for (let i = 1; i <= TOTAL_FEATURES; i += 1) {
  const id = `F${String(i).padStart(3, '0')}`;
  if (!porFeature.has(id)) descobertas.push(id);
}

console.log(`Features do catalogo: ${TOTAL_FEATURES}`);
console.log(`Com teste em algum nivel: ${porFeature.size}`);
console.log(`Sem teste: ${descobertas.length}`);

const soE2e = [...porFeature.entries()]
  .filter(([, niveis]) => niveis.size === 1 && niveis.has('e2e'))
  .map(([id]) => id);
console.log(`Cobertas apenas por E2E (candidatas a teste de dominio): ${soE2e.join(' ') || 'nenhuma'}`);

if (descobertas.length > 0) {
  console.log(`\nFeatures sem nenhum teste: ${descobertas.join(' ')}`);
  process.exit(1);
}
console.log('\nNenhuma feature do catalogo ficou sem teste.');
