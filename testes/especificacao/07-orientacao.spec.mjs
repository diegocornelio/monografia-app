// 07-orientacao.spec.mjs — R4 a R11 do plano. E a suite que decide se o modulo
// de orientacao foi construido como especificado ou apenas parecido com ele.
import assert from 'node:assert/strict';
import { suite, caso } from '../runner.mjs';

const t = (n) => `2026-09-07T1${n}:00:00Z`;

const novaTarefa = (m, extra = {}) =>
  m.criarTarefa({
    id: 'T1',
    blocoId: 'b3',
    ancora: { inicio: 10, fim: 42 },
    comentario: 'a hipotese nao esta delimitada neste paragrafo',
    autor: 'orientador',
    quando: t(0),
    ...extra,
  });

const ate = (m, tarefa, passos) =>
  passos.reduce((acc, p, i) => m.moverTarefa({ tarefa: acc, quando: t(i + 1), ...p }), tarefa);

suite('Backlog gerado por comentario', { modulo: () => import('../../src/domain/backlog.mjs') }, () => {
  caso('comentario do orientador nasce como tarefa aberta ancorada no bloco', ['F007', 'F068'], (m) => {
    const tarefa = novaTarefa(m);
    assert.equal(tarefa.estado, 'aberta');
    assert.equal(tarefa.blocoId, 'b3');
    assert.deepEqual(tarefa.ancora, { inicio: 10, fim: 42 });
  });

  caso('o fluxo previsto vai de aberta a arquivada', ['F069'], (m) => {
    const fim = ate(m, novaTarefa(m), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'diego' },
      { para: 'em_revisao', papel: 'orientado', quem: 'diego' },
      { para: 'validada', papel: 'orientador', quem: 'calabro' },
      { para: 'arquivada', papel: 'orientador', quem: 'calabro' },
    ]);
    assert.equal(fim.estado, 'arquivada');
  });

  caso('o orientador devolve para atendimento quando a revisao nao satisfaz', ['F069'], (m) => {
    const devolvida = ate(m, novaTarefa(m), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'diego' },
      { para: 'em_revisao', papel: 'orientado', quem: 'diego' },
      { para: 'em_atendimento', papel: 'orientador', quem: 'calabro', nota: 'ainda amplia' },
    ]);
    assert.equal(devolvida.estado, 'em_atendimento');
  });

  caso('recusa exige motivo e o motivo fica gravado', ['F069'], (m) => {
    assert.throws(() =>
      m.moverTarefa({ tarefa: novaTarefa(m), para: 'recusada', papel: 'orientado', quem: 'd', quando: t(1) }),
    );
    const r = m.moverTarefa({
      tarefa: novaTarefa(m),
      para: 'recusada',
      papel: 'orientado',
      quem: 'diego',
      quando: t(1),
      nota: 'ja tratado no capitulo 4',
    });
    assert.equal(r.motivoRecusa, 'ja tratado no capitulo 4');
  });

  caso('reabrir tarefa recusada e privilegio do orientador', ['F069', 'F070'], (m) => {
    const recusada = m.moverTarefa({
      tarefa: novaTarefa(m), para: 'recusada', papel: 'orientado', quem: 'd', quando: t(1), nota: 'x',
    });
    assert.throws(() => m.moverTarefa({ tarefa: recusada, para: 'aberta', papel: 'orientado', quem: 'd', quando: t(2) }));
    const reaberta = m.moverTarefa({ tarefa: recusada, para: 'aberta', papel: 'orientador', quem: 'c', quando: t(2) });
    assert.equal(reaberta.estado, 'aberta');
  });

  caso('transicao inexistente e recusada em vez de ignorada', ['F069'], (m) => {
    assert.throws(() =>
      m.moverTarefa({ tarefa: novaTarefa(m), para: 'arquivada', papel: 'orientador', quem: 'c', quando: t(1) }),
    );
  });
});

suite('Quem valida e quem arquiva', { modulo: () => import('../../src/domain/backlog.mjs') }, () => {
  const emRevisao = (m) =>
    ate(m, novaTarefa(m), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'diego' },
      { para: 'em_revisao', papel: 'orientado', quem: 'diego' },
    ]);

  caso('o orientador valida', ['F070'], (m) => {
    assert.equal(
      m.moverTarefa({ tarefa: emRevisao(m), para: 'validada', papel: 'orientador', quem: 'c', quando: t(3) }).estado,
      'validada',
    );
  });

  caso('o orientado tambem valida', ['F070'], (m) => {
    assert.equal(
      m.moverTarefa({ tarefa: emRevisao(m), para: 'validada', papel: 'orientado', quem: 'd', quando: t(3) }).estado,
      'validada',
    );
  });

  caso('o leitor nao valida nem arquiva, e nao recebe transicao alguma', ['F070'], (m) => {
    const t1 = emRevisao(m);
    assert.deepEqual(m.transicoesPossiveis({ tarefa: t1, papel: 'leitor' }), []);
    assert.throws(() => m.moverTarefa({ tarefa: t1, para: 'validada', papel: 'leitor', quem: 'x', quando: t(3) }));
  });

  caso('a interface pergunta ao dominio quais botoes desenhar', ['F070'], (m) => {
    const t1 = emRevisao(m);
    assert.deepEqual(m.transicoesPossiveis({ tarefa: t1, papel: 'orientador' }).sort(), [
      'em_atendimento',
      'validada',
    ]);
  });

  // Decisao de projeto registrada em 07/09/2026: recusa e juizo sobre o
  // apontamento, e cabe enquanto o trabalho nao foi feito. Depois que o
  // orientando entrega, o caminho e validar ou devolver para atendimento;
  // recusar ali descartaria trabalho ja realizado sem deixar rastro util.
  caso('recusar tarefa ja entregue em revisao e negado, por decisao de projeto', ['F069', 'F070'], (m) => {
    assert.throws(() =>
      m.moverTarefa({ tarefa: emRevisao(m), para: 'recusada', papel: 'orientador', quem: 'c', quando: t(3), nota: 'nao procede' }),
    );
  });

  caso('arquivar nao apaga: a tarefa segue consultavel com o ciclo inteiro', ['F070'], (m) => {
    const arquivada = ate(m, novaTarefa(m), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'd' },
      { para: 'em_revisao', papel: 'orientado', quem: 'd' },
      { para: 'validada', papel: 'orientador', quem: 'c' },
      { para: 'arquivada', papel: 'orientador', quem: 'c' },
    ]);
    assert.equal(arquivada.ciclo.length, 5);
    assert.equal(arquivada.comentario.length > 0, true);
  });
});

suite('Ciclo de otimizacao visivel ao orientador', { modulo: () => import('../../src/domain/backlog.mjs') }, () => {
  caso('toda passagem de estado grava quem, quando e nota', ['F069'], (m) => {
    const tarefa = ate(m, novaTarefa(m), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'diego' },
      { para: 'em_revisao', papel: 'orientado', quem: 'diego', nota: 'reescrevi o paragrafo' },
    ]);
    assert.deepEqual(tarefa.ciclo.map((c) => c.estado), ['aberta', 'em_atendimento', 'em_revisao']);
    assert.equal(tarefa.ciclo.at(-1).quem, 'diego');
    assert.equal(tarefa.ciclo.at(-1).nota, 'reescrevi o paragrafo');
  });

  caso('ida e volta repetida fica contabilizada, e nao sobrescrita', ['F069'], (m) => {
    const tarefa = ate(m, novaTarefa(m), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'd' },
      { para: 'em_revisao', papel: 'orientado', quem: 'd' },
      { para: 'em_atendimento', papel: 'orientador', quem: 'c', nota: 'ainda nao' },
      { para: 'em_revisao', papel: 'orientado', quem: 'd' },
    ]);
    assert.equal(tarefa.ciclo.filter((c) => c.estado === 'em_revisao').length, 2);
  });
});

suite('Ciclo cruzado com as versoes do bloco', { modulo: () => import('../../src/domain/orientacao/ciclo.mjs') }, () => {
  caso('a tarefa mostra as versoes do bloco gravadas desde a abertura', ['F069', 'F059'], (m) => {
    const r = m.versoesDaTarefa({
      tarefa: { criadaEm: t(1), blocoId: 'b1' },
      historicoDoBloco: {
        versoes: [
          { estado: 'antes', quando: t(0) },
          { estado: 'durante', quando: t(2) },
        ],
        atual: 'agora',
      },
    });
    assert.deepEqual(r.versoes.map((v) => v.estado), ['durante']);
  });

  caso('quando a janela de cinco engoliu versoes, o painel declara a perda', ['F062', 'F069'], (m) => {
    const r = m.versoesDaTarefa({
      tarefa: { criadaEm: t(0), blocoId: 'b1' },
      historicoDoBloco: { versoes: Array.from({ length: 5 }, (_, i) => ({ estado: `v${i}`, quando: t(3) })), atual: 'x' },
      edicoesContabilizadas: 9,
    });
    assert.equal(r.historicoIncompleto, true);
    assert.match(r.aviso, /nao estao mais no historico/i);
  });
});

suite('Grafico de realizadas e pendentes', { modulo: () => import('../../src/domain/backlog.mjs') }, () => {
  const conjunto = (m) => {
    const aberta = novaTarefa(m, { id: 'T1' });
    const emAtendimento = m.moverTarefa({
      tarefa: novaTarefa(m, { id: 'T2' }), para: 'em_atendimento', papel: 'orientado', quem: 'd', quando: t(1),
    });
    const validada = ate(m, novaTarefa(m, { id: 'T3' }), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'd' },
      { para: 'em_revisao', papel: 'orientado', quem: 'd' },
      { para: 'validada', papel: 'orientador', quem: 'c' },
    ]);
    const recusada = m.moverTarefa({
      tarefa: novaTarefa(m, { id: 'T4' }), para: 'recusada', papel: 'orientador', quem: 'c', quando: t(1), nota: 'x',
    });
    return [aberta, emAtendimento, validada, recusada];
  };

  caso('pendentes agrupam aberta, em atendimento e em revisao', ['F064'], (m) => {
    assert.equal(m.resumoBacklog(conjunto(m)).pendentes, 2);
  });

  caso('realizadas agrupam validada e arquivada', ['F064'], (m) => {
    assert.equal(m.resumoBacklog(conjunto(m)).realizadas, 1);
  });

  caso('recusadas contam a parte e nao inflam o progresso', ['F064'], (m) => {
    const r = m.resumoBacklog(conjunto(m));
    assert.equal(r.recusadas, 1);
    assert.equal(r.percentual, 25);
  });

  caso('backlog vazio nao divide por zero', ['F064'], (m) => {
    assert.deepEqual(m.resumoBacklog([]), { pendentes: 0, realizadas: 0, recusadas: 0, total: 0, percentual: 0 });
  });
});

suite('Grafico narrado, nao decorativo', { modulo: () => import('../../src/ui/graficos/GraficoNarrado.mjs') }, () => {
  caso('o componente exige afirmacao, destaque e anotacoes', ['F064', 'F036'], (m) => {
    assert.throws(() => m.validarProps({ dados: [] }));
    assert.doesNotThrow(() =>
      m.validarProps({ dados: [], afirmacao: '18 de 27 apontamentos atendidos', destaque: 'pendentes', anotacoes: [] }),
    );
  });

  caso('o titulo e afirmacao, e titulo que so nomeia o assunto e recusado', ['F064'], (m) => {
    assert.throws(() => m.validarProps({ dados: [], afirmacao: 'Status das tarefas', destaque: 'x', anotacoes: [] }));
  });

  caso('todo grafico tem alternativa textual', ['F064'], (m) => {
    const g = m.montar({ dados: [{ x: 1, y: 2 }], afirmacao: 'Metade do backlog esta atendida', destaque: 'pendentes', anotacoes: [] });
    assert.equal(typeof g.alternativaTextual, 'string');
    assert.equal(g.alternativaTextual.length > 0, true);
  });

  caso('sem dados o grafico entrega estado vazio digno, e nao area em branco', ['F064'], (m) => {
    assert.match(m.montar({ dados: [], afirmacao: 'Ainda sem apontamentos', destaque: null, anotacoes: [] }).estadoVazio, /\w/);
  });
});

suite('Listagem descritiva rolavel', { modulo: () => import('../../src/domain/backlog.mjs') }, () => {
  caso('o que espera decisao humana vem no topo', ['F065', 'F011'], (m) => {
    const aberta = novaTarefa(m, { id: 'T1' });
    const emRevisao = ate(m, novaTarefa(m, { id: 'T2' }), [
      { para: 'em_atendimento', papel: 'orientado', quem: 'd' },
      { para: 'em_revisao', papel: 'orientado', quem: 'd' },
    ]);
    assert.equal(m.listarParaRolagem([aberta, emRevisao])[0].id, 'T2');
  });

  caso('a ordem completa segue revisao, aberta, atendimento, recusada, validada, arquivada', ['F065'], (m) => {
    const fabricar = (id, passos) => ate(m, novaTarefa(m, { id }), passos);
    const lista = m.listarParaRolagem([
      fabricar('arq', [
        { para: 'em_atendimento', papel: 'orientado', quem: 'd' },
        { para: 'em_revisao', papel: 'orientado', quem: 'd' },
        { para: 'validada', papel: 'orientador', quem: 'c' },
        { para: 'arquivada', papel: 'orientador', quem: 'c' },
      ]),
      fabricar('rec', [{ para: 'recusada', papel: 'orientador', quem: 'c', nota: 'x' }]),
      novaTarefa(m, { id: 'abe' }),
      fabricar('rev', [
        { para: 'em_atendimento', papel: 'orientado', quem: 'd' },
        { para: 'em_revisao', papel: 'orientado', quem: 'd' },
      ]),
    ]);
    assert.deepEqual(lista.map((x) => x.id), ['rev', 'abe', 'rec', 'arq']);
  });

  caso('empate de estado e desfeito pela data de criacao', ['F065'], (m) => {
    const antiga = novaTarefa(m, { id: 'velha', quando: '2026-01-01T00:00:00Z' });
    const nova = novaTarefa(m, { id: 'nova', quando: '2026-09-01T00:00:00Z' });
    assert.deepEqual(m.listarParaRolagem([nova, antiga]).map((x) => x.id), ['velha', 'nova']);
  });
});

suite('Item da listagem e autossuficiente', { modulo: () => import('../../src/domain/orientacao/item.mjs') }, () => {
  caso('o item traz capitulo, trecho, comentario, autor, estado, idade e idas e voltas', ['F065'], (m) => {
    const item = m.montarItem({
      tarefa: {
        id: 'T1', estado: 'em_revisao', comentario: 'delimitar a hipotese', autor: 'calabro',
        criadaEm: '2026-09-01T00:00:00Z', atualizadaEm: '2026-09-05T00:00:00Z',
        ciclo: [{ estado: 'aberta' }, { estado: 'em_atendimento' }, { estado: 'em_revisao' }],
        ancora: { transcricao: 'a arquitetura garante integridade' },
      },
      bloco: { numero: '3.2', titulo: 'Mecanismo' },
      agora: '2026-09-07T00:00:00Z',
      papel: 'orientador',
    });
    assert.equal(item.capitulo, '3.2 Mecanismo');
    assert.equal(item.trecho, 'a arquitetura garante integridade');
    assert.equal(item.autor, 'calabro');
    assert.equal(item.idadeNoEstadoDias, 2);
    assert.equal(item.idasEVoltas, 0);
    assert.deepEqual(item.acoes.sort(), ['em_atendimento', 'recusada', 'validada']);
  });

  caso('para o leitor o mesmo item vem sem acao alguma', ['F065', 'F070'], (m) => {
    const item = m.montarItem({
      tarefa: { id: 'T1', estado: 'em_revisao', ciclo: [], ancora: {}, criadaEm: '2026-09-01T00:00:00Z' },
      bloco: { numero: '1', titulo: 'X' },
      agora: '2026-09-07T00:00:00Z',
      papel: 'leitor',
    });
    assert.deepEqual(item.acoes, []);
  });
});

suite('Comentario ancorado e reancoragem', { modulo: () => import('../../src/domain/orientacao/ancora.mjs') }, () => {
  const texto = 'A arquitetura garante integridade dos registros e resolve o problema.';

  caso('o comentario guarda a transcricao do trecho, alem dos deslocamentos', ['F068'], (m) => {
    const c = m.criarComentario({ blocoId: 'b1', texto: 'delimitar', inicio: 16, fim: 35, conteudoBloco: texto });
    assert.equal(c.ancora.transcricao, 'garante integridade');
  });

  caso('edicao antes do trecho reancora pelos novos deslocamentos', ['F068'], (m) => {
    const c = m.criarComentario({ blocoId: 'b1', texto: 'x', inicio: 16, fim: 35, conteudoBloco: texto });
    const novo = `Em tese, ${texto}`;
    const r = m.reancorar({ comentario: c, conteudoBloco: novo });
    assert.equal(r.flutuante, false);
    assert.equal(novo.slice(r.ancora.inicio, r.ancora.fim), 'garante integridade');
  });

  caso('reescrita total do bloco deixa o comentario flutuante, e nao apontando errado', ['F068'], (m) => {
    const c = m.criarComentario({ blocoId: 'b1', texto: 'x', inicio: 16, fim: 35, conteudoBloco: texto });
    const r = m.reancorar({ comentario: c, conteudoBloco: 'Texto inteiramente diferente do anterior.' });
    assert.equal(r.flutuante, true);
    assert.equal(r.ancora.transcricao, 'garante integridade');
  });

  caso('comentario flutuante nunca some: aparece no topo do bloco com aviso', ['F068'], (m) => {
    const c = m.criarComentario({ blocoId: 'b1', texto: 'x', inicio: 16, fim: 35, conteudoBloco: texto });
    const r = m.reancorar({ comentario: c, conteudoBloco: 'outro' });
    assert.equal(r.posicaoDeExibicao, 'topoDoBloco');
    assert.match(r.aviso, /texto original mudou/i);
  });

  caso('comentario marcado sem tarefa fica como nota e fora do grafico', ['F007', 'F064'], (m) => {
    const c = m.criarComentario({ blocoId: 'b1', texto: 'bom paragrafo', inicio: 0, fim: 1, conteudoBloco: texto, geraTarefa: false });
    assert.equal(c.geraTarefa, false);
    assert.equal(m.entraNoBacklog(c), false);
  });

  caso('por padrao todo comentario gera tarefa', ['F007'], (m) => {
    const c = m.criarComentario({ blocoId: 'b1', texto: 'ajustar', inicio: 0, fim: 1, conteudoBloco: texto });
    assert.equal(c.geraTarefa, true);
  });
});
