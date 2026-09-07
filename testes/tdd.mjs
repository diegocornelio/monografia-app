// tdd.mjs — entrada unica da especificacao executavel.
// Uso: node testes/tdd.mjs [--silencioso] [--exigir-verde] [--fase=N|--ate-fase=N]
//
// Codigo de saida: 0 quando nao ha vermelho. Pendencia nao reprova, porque em
// TDD pendente significa "ainda nao construido", e o CI da fase corrente so
// exige verde no que ja entrou em escopo. Com --exigir-verde, pendencia tambem
// reprova, e e assim que se fecha uma fase.
import { executar, relatorio } from './runner.mjs';

const silencioso = process.argv.includes('--silencioso');
const exigirVerde = process.argv.includes('--exigir-verde');
const fase = Number((process.argv.find((a) => a.startsWith('--fase=')) ?? '').split('=')[1]);
const ateFase = Number((process.argv.find((a) => a.startsWith('--ate-fase=')) ?? '').split('=')[1]);

const suites = [
  { fase: 1, arquivo: './especificacao/01-fichamento.spec.mjs' },
  { fase: 1, arquivo: './especificacao/02-versionamento.spec.mjs' },
  { fase: 1, arquivo: './especificacao/03-abnt.spec.mjs' },
  { fase: 1, arquivo: './especificacao/04-intercambio.spec.mjs' },
  { fase: 2, arquivo: './especificacao/05-acervo.spec.mjs' },
  { fase: 3, arquivo: './especificacao/06-monografia.spec.mjs' },
  { fase: 3, arquivo: './especificacao/07-orientacao.spec.mjs' },
  { fase: 4, arquivo: './especificacao/08-agentes.spec.mjs' },
  { fase: 5, arquivo: './especificacao/09-multiusuario.spec.mjs' },
  { fase: 5, arquivo: './especificacao/10-operacao.spec.mjs' },
];

const selecionadas = suites.filter((s) => {
  if (Number.isFinite(fase) && fase > 0) return s.fase === fase;
  if (Number.isFinite(ateFase) && ateFase > 0) return s.fase <= ateFase;
  return true;
});

for (const s of selecionadas) {
  await import(s.arquivo);
}

const resultado = await executar({ silencioso });
const semVermelho = relatorio(resultado);

if (!semVermelho) process.exit(1);
if (exigirVerde && resultado.pendente > 0) {
  console.log('\nModo --exigir-verde: existem pendencias, a fase nao pode ser fechada.');
  process.exit(1);
}
