// tdd.mjs — entrada unica da especificacao executavel.
// Uso: node testes/tdd.mjs [--silencioso] [--exigir-verde]
//
// Codigo de saida: 0 quando nao ha vermelho. Pendencia nao reprova, porque em
// TDD pendente significa "ainda nao construido", e o CI da fase corrente so
// exige verde no que ja entrou em escopo. Com --exigir-verde, pendencia tambem
// reprova, e e assim que se fecha uma fase.
import { executar, relatorio } from './runner.mjs';

await import('./especificacao/01-fichamento.spec.mjs');
await import('./especificacao/02-versionamento.spec.mjs');
await import('./especificacao/03-abnt.spec.mjs');
await import('./especificacao/04-intercambio.spec.mjs');
await import('./especificacao/05-acervo.spec.mjs');
await import('./especificacao/06-monografia.spec.mjs');
await import('./especificacao/07-orientacao.spec.mjs');
await import('./especificacao/08-agentes.spec.mjs');
await import('./especificacao/09-multiusuario.spec.mjs');
await import('./especificacao/10-operacao.spec.mjs');

const silencioso = process.argv.includes('--silencioso');
const exigirVerde = process.argv.includes('--exigir-verde');

const resultado = await executar({ silencioso });
const semVermelho = relatorio(resultado);

if (!semVermelho) process.exit(1);
if (exigirVerde && resultado.pendente > 0) {
  console.log('\nModo --exigir-verde: existem pendencias, a fase nao pode ser fechada.');
  process.exit(1);
}
