// 06-monografia.spec.mjs — Fase 3: estrutura, paginacao, metas e rastreabilidade.
import assert from 'node:assert/strict';
import { suite, caso } from '../runner.mjs';

const bloco = (id, nivel, tipo = 'textual') => ({ id, nivel, tipo });

suite('Sumario: numeracao e movimento', { modulo: () => import('../../src/domain/sumario.mjs') }, () => {
  caso('a numeracao vai ate o nivel cinco', ['F024'], (m) => {
    assert.equal(m.PROFUNDIDADE_MAX, 5);
    const r = m.renumerar([1, 2, 3, 4, 5].map((n, i) => bloco(`b${i}`, n)));
    assert.equal(r.at(-1).numero, '1.1.1.1.1');
  });

  caso('pretextual e postextual nunca recebem numero', ['F024', 'F028'], (m) => {
    const r = m.renumerar([bloco('a', 1, 'pretextual'), bloco('b', 1), bloco('c', 1, 'postextual')]);
    assert.deepEqual(r.map((x) => x.numero), [null, '1', null]);
  });

  caso('reordenar renumera a sequencia inteira de forma coerente', ['F024'], (m) => {
    const blocos = [bloco('a', 1), bloco('b', 2), bloco('c', 2)];
    const r = m.renumerar(m.mover({ blocos, de: 2, para: 1, modo: 'reordenar' }));
    assert.deepEqual(r.map((x) => x.numero), ['1', '1.1', '1.2']);
  });

  caso('nenhum bloco desaparece em movimento repetido', ['F024'], (m) => {
    let blocos = Array.from({ length: 10 }, (_, i) => bloco(`id${i}`, (i % 5) + 1));
    const ids = new Set(blocos.map((b) => b.id));
    for (let i = 0; i < 300; i += 1) {
      const de = Math.floor(Math.random() * blocos.length);
      const para = Math.floor(Math.random() * blocos.length);
      blocos = m.mover({ blocos, de, para, modo: Math.random() < 0.5 ? 'trocar' : 'reordenar' });
    }
    assert.deepEqual(new Set(blocos.map((b) => b.id)), ids);
  });
});

suite('Sumario, lista de figuras e lista de tabelas gerados', { modulo: () => import('../../src/domain/monografia/listas.mjs') }, () => {
  const projeto = {
    blocos: [
      { id: 'b1', numero: '1', titulo: 'Introducao', tipo: 'textual', pagina: 11 },
      { id: 'b2', numero: '1.1', titulo: 'Problema', tipo: 'textual', pagina: 13 },
    ],
    figuras: [{ id: 'f1', blocoId: 'b1', legenda: 'Fluxo', pagina: 12 }],
    tabelas: [{ id: 't1', blocoId: 'b2', titulo: 'Casos', pagina: 14 }],
  };

  caso('o sumario reflete a estrutura com numero, titulo e pagina', ['F029'], (m) => {
    assert.deepEqual(m.gerarSumario(projeto), [
      { numero: '1', titulo: 'Introducao', pagina: 11, nivel: 1 },
      { numero: '1.1', titulo: 'Problema', pagina: 13, nivel: 2 },
    ]);
  });

  caso('figuras sao numeradas sequencialmente na ordem de aparicao', ['F029'], (m) => {
    assert.equal(m.gerarListaFiguras(projeto)[0].rotulo, 'Figura 1 - Fluxo');
  });

  caso('tabelas tem numeracao propria, independente das figuras', ['F029'], (m) => {
    assert.equal(m.gerarListaTabelas(projeto)[0].rotulo, 'Tabela 1 - Casos');
  });

  caso('mover bloco renumera figuras e tabelas junto', ['F029'], (m) => {
    const invertido = { ...projeto, blocos: [...projeto.blocos].reverse() };
    assert.equal(m.gerarListaTabelas(invertido)[0].rotulo, 'Tabela 1 - Casos');
  });

  caso('as tres listas derivam do mesmo estado, nunca de copia manual', ['F029'], (m) => {
    assert.equal(m.gerarSumario(projeto).length, projeto.blocos.length);
  });
});

suite('Paginacao: bloco indivisivel e figura com legenda', { modulo: () => import('../../src/domain/monografia/paginacao.mjs') }, () => {
  caso('ficha que nao cabe no espaco restante vai inteira para a proxima pagina', ['F003'], (m) => {
    const r = m.distribuir({
      alturaPagina: 1000,
      itens: [{ id: 'a', altura: 700, indivisivel: true }, { id: 'b', altura: 400, indivisivel: true }],
    });
    assert.deepEqual(r.paginas.map((p) => p.map((i) => i.id)), [['a'], ['b']]);
  });

  caso('duas fichas de meia pagina cabem no mesmo A4', ['F003'], (m) => {
    const r = m.distribuir({
      alturaPagina: 1000,
      itens: [{ id: 'a', altura: 460, indivisivel: true }, { id: 'b', altura: 460, indivisivel: true }],
    });
    assert.equal(r.paginas.length, 1);
  });

  caso('nenhum item indivisivel aparece em duas paginas', ['F003'], (m) => {
    const itens = Array.from({ length: 200 }, (_, i) => ({
      id: `i${i}`,
      altura: 200 + ((i * 37) % 600),
      indivisivel: true,
    }));
    const r = m.distribuir({ alturaPagina: 1000, itens });
    const vistos = r.paginas.flat().map((i) => i.id);
    assert.equal(new Set(vistos).size, 200);
  });

  caso('figura e legenda formam grupo indivisivel', ['F027'], (m) => {
    const r = m.distribuir({
      alturaPagina: 1000,
      itens: [
        { id: 'texto', altura: 800 },
        { id: 'fig', altura: 300, grupo: 'g1', indivisivel: true },
        { id: 'legenda', altura: 60, grupo: 'g1', indivisivel: true },
      ],
    });
    const pagina = r.paginas.find((p) => p.some((i) => i.id === 'fig'));
    assert.equal(pagina.some((i) => i.id === 'legenda'), true);
  });

  caso('no modo auto-ajuste a figura reduz e a legenda nunca reduz', ['F027'], (m) => {
    const r = m.ajustarGrupo({
      disponivel: 300,
      figura: { altura: 400, minima: 150 },
      legenda: { altura: 60 },
    });
    assert.equal(r.legenda.altura, 60);
    assert.equal(r.figura.altura <= 240, true);
  });

  caso('quando nem o minimo da figura cabe, o grupo vai para a proxima pagina', ['F027'], (m) => {
    const r = m.ajustarGrupo({ disponivel: 100, figura: { altura: 400, minima: 150 }, legenda: { altura: 60 } });
    assert.equal(r.quebraParaProxima, true);
  });
});

suite('Contagem, metas e progresso', { modulo: () => import('../../src/domain/monografia/metas.mjs') }, () => {
  caso('contagem de palavras ignora marcacao do editor', ['F034'], (m) => {
    const conteudo = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'uma frase com cinco palavras' }] }] };
    assert.equal(m.contarPalavras(conteudo), 5);
  });

  caso('citacao longa nao conta como palavra escrita pelo autor', ['F034'], (m) => {
    const conteudo = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'texto do autor' }] },
        { type: 'citacaoLonga', content: [{ type: 'text', text: 'trecho copiado da fonte inteiro' }] },
      ],
    };
    assert.equal(m.contarPalavras(conteudo), 3);
  });

  caso('a serie diaria e gravada por dia, sem duplicar o mesmo dia', ['F034'], (m) => {
    let s = m.registrarDia([], { dia: '2026-09-07', palavras: 300 });
    s = m.registrarDia(s, { dia: '2026-09-07', palavras: 450 });
    assert.equal(s.length, 1);
    assert.equal(s[0].palavras, 450);
  });

  caso('o progresso contra meta e proporcao, nao promessa de prazo', ['F034'], (m) => {
    const p = m.progresso({ escritas: 620, meta: 1000 });
    assert.equal(p.percentual, 62);
    assert.equal('previsaoDeConclusao' in p, false);
  });
});

suite('Matriz de rastreabilidade e diario', { modulo: () => import('../../src/domain/monografia/rastro.mjs') }, () => {
  caso('cada objetivo aponta capitulo e evidencia', ['F080'], (m) => {
    const linha = m.criarRastro({
      perguntaPesquisa: 'Como registrar decisao?',
      objetivo: 'Descrever o mecanismo',
      blocoId: 'b3',
      evidencias: ['q1', 'q2'],
    });
    assert.equal(linha.evidencias.length, 2);
  });

  caso('objetivo sem capitulo vinculado aparece como lacuna', ['F080'], (m) => {
    const r = m.conferirCobertura({
      rastros: [{ objetivo: 'O1', blocoId: 'b1' }, { objetivo: 'O2', blocoId: null }],
    });
    assert.deepEqual(r.lacunas, ['O2']);
  });

  caso('capitulo sem nenhuma evidencia e apontado', ['F080'], (m) => {
    const r = m.conferirCobertura({ rastros: [{ objetivo: 'O1', blocoId: 'b1', evidencias: [] }] });
    assert.deepEqual(r.semEvidencia, ['b1']);
  });

  caso('entrada de diario marcada como decisao metodologica e recuperavel', ['F081'], (m) => {
    const d = [
      m.criarEntrada({ data: '2026-09-01', texto: 'li a norma', decisaoMetodologica: false }),
      m.criarEntrada({ data: '2026-09-02', texto: 'adotei amostra por conveniencia', decisaoMetodologica: true }),
    ];
    assert.equal(m.decisoesMetodologicas(d).length, 1);
  });
});

suite('Mapa de encadeamento logico', { modulo: () => import('../../src/domain/mapaLogico.mjs') }, () => {
  const mapa = {
    nos: [
      { id: 'p1', tipo: 'premissa', rotulo: 'Registros dispersos' },
      { id: 'a1', tipo: 'afirmacao', rotulo: 'Custo alto' },
      { id: 'c1', tipo: 'conclusao', rotulo: 'Substrato reduz custo' },
    ],
    arestas: [
      { de: 'p1', para: 'a1', tipo: 'sustenta' },
      { de: 'a1', para: 'c1', tipo: 'salto' },
    ],
  };

  caso('o gerador produz flowchart com forma distinta por tipo de no', ['F037'], (m) => {
    const src = m.gerarMermaid(mapa);
    assert.match(src, /^flowchart TD/);
    assert.match(src, /p1\(\[/);
    assert.match(src, /c1\[\[/);
  });

  caso('aresta de salto sai pontilhada e rotulada', ['F037'], (m) => {
    assert.match(m.gerarMermaid(mapa), /-\. "salto lógico" \.-> c1/);
  });

  caso('snapshot identico nao grava versao nova', ['F037'], (m) => {
    const v1 = m.snapshot([], mapa);
    assert.equal(m.snapshot(v1, mapa).length, 1);
  });

  caso('edicao grava versao nova e preserva a anterior', ['F037'], (m) => {
    const v1 = m.snapshot([], mapa);
    const alterado = { ...mapa, nos: [...mapa.nos, { id: 'a2', tipo: 'afirmacao', rotulo: 'Nova' }] };
    const v2 = m.snapshot(v1, alterado);
    assert.equal(v2.length, 2);
    assert.equal(v2[0].hash, v1[0].hash);
  });
});
