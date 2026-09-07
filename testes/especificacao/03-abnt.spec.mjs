// 03-abnt.spec.mjs — formatacao de referencia, verificador pre-export e listas.
//
// Aviso de estado de verificacao, na linha do §9 do plano: os casos golden
// abaixo expressam o preset interno do Fichario, derivado da planilha lida e da
// pratica ja adotada no projeto. Eles NAO foram conferidos contra leitura em
// fonte primaria das NBR 6023, 6024, 6027, 6028, 6034, 10520 e 14724. Antes de
// rotular o preset com o ano da norma, cada caso precisa ser reconferido contra
// o texto vigente, e este arquivo e o lugar onde a correcao entra.
import assert from 'node:assert/strict';
import { suite, caso } from '../runner.mjs';

suite('Referencia montada por campos estruturados', { modulo: () => import('../../src/domain/abnt/referencia.mjs') }, () => {
  const livro = {
    tipoFonte: 'livro',
    autorSobrenome: 'ECO',
    autorNome: 'Umberto',
    titulo: 'Como se faz uma tese em Ciências Humanas',
    edicao: 6,
    cidade: 'Lisboa',
    editora: 'Editorial Presença',
    ano: 1995,
  };

  caso('livro sai no formato do preset, com sobrenome em caixa alta', ['F006'], (m) => {
    assert.equal(
      m.formatar(livro),
      'ECO, Umberto. Como se faz uma tese em Ciências Humanas. 6. ed. Lisboa: Editorial Presença, 1995.',
    );
  });

  caso('primeira edicao nao imprime o numero da edicao', ['F006'], (m) => {
    assert.equal(m.formatar({ ...livro, edicao: 1 }).includes('1. ed.'), false);
  });

  caso('dois autores sao separados por ponto e virgula', ['F006'], (m) => {
    const r = m.formatar({
      ...livro,
      autores: [
        { sobrenome: 'MASON', nome: 'Stephen' },
        { sobrenome: 'SENG', nome: 'Daniel' },
      ],
    });
    assert.match(r, /^MASON, Stephen; SENG, Daniel\./);
  });

  caso('mais de tres autores usa o primeiro seguido da expressao et al', ['F006'], (m) => {
    const autores = ['A', 'B', 'C', 'D'].map((x) => ({ sobrenome: x, nome: 'N' }));
    assert.match(m.formatar({ ...livro, autores }), /^A, N et al\./);
  });

  caso('obra sem autor comeca pelo titulo', ['F006'], (m) => {
    const semAutor = { ...livro, autorSobrenome: null, autorNome: null, autores: [] };
    assert.match(m.formatar(semAutor), /^Como se faz uma tese/);
  });

  caso('artigo de periodico traz periodico, volume, numero, paginas e ano', ['F006'], (m) => {
    const r = m.formatar({
      tipoFonte: 'artigo',
      autorSobrenome: 'SILVA',
      autorNome: 'Ana',
      titulo: 'Rastreabilidade documental',
      periodico: 'Revista de Direito',
      volume: 12,
      numero: 3,
      paginaInicial: 45,
      paginaFinal: 67,
      ano: 2021,
    });
    assert.match(r, /Revista de Direito, v\. 12, n\. 3, p\. 45-67, 2021\./);
  });

  caso('capitulo de livro traz o organizador e a expressao In', ['F006'], (m) => {
    const r = m.formatar({
      tipoFonte: 'capitulo',
      autorSobrenome: 'LIMA',
      autorNome: 'Joao',
      titulo: 'Prova eletronica',
      organizadores: [{ sobrenome: 'MASON', nome: 'Stephen' }],
      tituloObra: 'Electronic Evidence',
      cidade: 'Londres',
      editora: 'ULP',
      ano: 2017,
      paginaInicial: 10,
      paginaFinal: 40,
    });
    assert.match(r, /In: MASON, Stephen \(org\.\)\./);
  });

  caso('site traz data de acesso e o endereco', ['F006'], (m) => {
    const r = m.formatar({
      tipoFonte: 'site',
      titulo: 'Consulta publica 39',
      url: 'https://exemplo.org/cp39',
      acessoEm: '2026-09-07',
    });
    assert.match(r, /Disponível em: https:\/\/exemplo\.org\/cp39\. Acesso em: 7 set\. 2026\./);
  });

  caso('campo obrigatorio ausente devolve erro localizado, nunca referencia parcial silenciosa', ['F006'], (m) => {
    const r = m.validar({ tipoFonte: 'livro', titulo: 'X' });
    assert.equal(r.valido, false);
    assert.deepEqual(r.faltando.sort(), ['ano', 'cidade', 'editora']);
  });

  caso('a mesma fonte muda de saida quando muda o preset, sem redigitar campo', ['F006', 'F054'], (m) => {
    const abnt = m.formatar(livro, { preset: 'fichario-abnt' });
    const vancouver = m.formatar(livro, { preset: 'vancouver' });
    assert.notEqual(abnt, vancouver);
  });
});

suite('Verificador normativo pre-export', { modulo: () => import('../../src/domain/abnt/verificador.mjs') }, () => {
  const projetoLimpo = {
    tipo: 'Monografia',
    preset: { margens: [3, 2, 2, 3], corpo: 12, entrelinha: 1.5 },
    pretextuais: ['capa', 'folhaRosto', 'folhaAprovacao', 'resumo', 'abstract', 'sumario'],
    blocos: [],
    figuras: [],
    tabelas: [],
    citacoes: [],
    referencias: [],
    siglas: [],
  };

  caso('projeto conforme nao gera violacao', ['F084'], (m) => {
    assert.deepEqual(m.verificar(projetoLimpo).violacoes, []);
  });

  caso('figura sem alt-text bloqueia o export e aponta a figura', ['F035', 'F084'], (m) => {
    const r = m.verificar({
      ...projetoLimpo,
      figuras: [{ id: 'fig1', legenda: 'Fluxo', fonte: 'autor', altText: '' }],
    });
    const v = r.violacoes.find((x) => x.regra === 'figuraSemAltText');
    assert.equal(v.bloqueia, true);
    assert.equal(v.ancora.id, 'fig1');
  });

  caso('figura sem legenda ou sem fonte bloqueia', ['F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, figuras: [{ id: 'f2', legenda: '', fonte: '', altText: 'a' }] });
    assert.deepEqual(
      r.violacoes.map((x) => x.regra).sort(),
      ['figuraSemFonte', 'figuraSemLegenda'],
    );
  });

  caso('tabela sem titulo ou sem fonte bloqueia', ['F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, tabelas: [{ id: 't1', titulo: '', fonte: '' }] });
    assert.equal(r.violacoes.length, 2);
  });

  caso('citacao longa fora do recuo de quatro centimetros bloqueia', ['F084'], (m) => {
    const r = m.verificar({
      ...projetoLimpo,
      citacoes: [{ id: 'c1', linhas: 5, recuoCm: 1.25, corpo: 12, pagina: 10 }],
    });
    assert.equal(r.violacoes.some((x) => x.regra === 'citacaoLongaSemRecuo'), true);
  });

  caso('citacao sem pagina bloqueia', ['F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, citacoes: [{ id: 'c2', linhas: 1, pagina: null }] });
    assert.equal(r.violacoes.some((x) => x.regra === 'citacaoSemPagina'), true);
  });

  caso('pre-textual obrigatorio ausente para o tipo de trabalho bloqueia', ['F083', 'F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, pretextuais: ['capa'] });
    const v = r.violacoes.find((x) => x.regra === 'pretextualObrigatorioAusente');
    assert.equal(v.bloqueia, true);
    assert.equal(v.faltando.includes('folhaAprovacao'), true);
  });

  caso('margem divergente do preset gera aviso e nao bloqueio', ['F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, preset: { ...projetoLimpo.preset, margens: [2, 2, 2, 2] } });
    const v = r.violacoes.find((x) => x.regra === 'margemDivergente');
    assert.equal(v.bloqueia, false);
  });

  caso('cada violacao carrega ancora clicavel para o ponto do documento', ['F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, tabelas: [{ id: 't9', titulo: '', fonte: 'x' }] });
    assert.equal(typeof r.violacoes[0].ancora.id, 'string');
  });

  caso('exportacao e negada quando existe violacao bloqueante', ['F084'], (m) => {
    const r = m.verificar({ ...projetoLimpo, citacoes: [{ id: 'c3', linhas: 1, pagina: null }] });
    assert.equal(r.podeExportar, false);
  });
});

suite('Citacao orfa e referencia nao citada', { modulo: () => import('../../src/domain/abnt/coerencia.mjs') }, () => {
  caso('citacao no texto sem referencia correspondente e apontada', ['F085'], (m) => {
    const r = m.conferir({
      citacoesNoTexto: [{ id: 'c1', fonteId: 'f9' }],
      referencias: [{ fonteId: 'f1' }],
    });
    assert.deepEqual(r.orfas.map((x) => x.fonteId), ['f9']);
  });

  caso('referencia listada sem uso no texto e apontada', ['F085'], (m) => {
    const r = m.conferir({ citacoesNoTexto: [], referencias: [{ fonteId: 'f1' }] });
    assert.deepEqual(r.naoCitadas.map((x) => x.fonteId), ['f1']);
  });

  caso('a lista fecha dos dois lados quando tudo esta vinculado', ['F085'], (m) => {
    const r = m.conferir({ citacoesNoTexto: [{ id: 'c', fonteId: 'f1' }], referencias: [{ fonteId: 'f1' }] });
    assert.equal(r.orfas.length + r.naoCitadas.length, 0);
    assert.equal(r.podeExportar, true);
  });

  caso('orfa bloqueia export, nao citada apenas avisa', ['F085'], (m) => {
    const orfa = m.conferir({ citacoesNoTexto: [{ id: 'c', fonteId: 'f9' }], referencias: [] });
    const sobra = m.conferir({ citacoesNoTexto: [], referencias: [{ fonteId: 'f1' }] });
    assert.equal(orfa.podeExportar, false);
    assert.equal(sobra.podeExportar, true);
  });
});

suite('Lista de siglas e glossario gerados', { modulo: () => import('../../src/domain/abnt/siglas.mjs') }, () => {
  const blocos = [
    { id: 'b1', numero: '1', texto: 'A Camara de Comercializacao de Energia Eletrica (CCEE) publica dados. A CCEE tambem opera.' },
    { id: 'b2', numero: '2', texto: 'O ambiente ACL cresce, e a CCEE registra.' },
  ];

  caso('sigla definida entre parenteses entra na lista com o significado', ['F082'], (m) => {
    const lista = m.extrairSiglas(blocos);
    const ccee = lista.find((s) => s.sigla === 'CCEE');
    assert.equal(ccee.significado, 'Camara de Comercializacao de Energia Eletrica');
  });

  caso('a primeira ocorrencia guarda o bloco de origem', ['F082'], (m) => {
    assert.equal(m.extrairSiglas(blocos).find((s) => s.sigla === 'CCEE').primeiraOcorrenciaBlocoId, 'b1');
  });

  caso('sigla usada sem definicao previa e apontada como pendente', ['F082', 'F084'], (m) => {
    const lista = m.extrairSiglas(blocos);
    const acl = lista.find((s) => s.sigla === 'ACL');
    assert.equal(acl.significado, null);
    assert.equal(acl.pendente, true);
  });

  caso('a lista sai em ordem alfabetica', ['F082'], (m) => {
    const siglas = m.extrairSiglas(blocos).map((s) => s.sigla);
    assert.deepEqual(siglas, [...siglas].sort());
  });

  caso('sigla repetida aparece uma unica vez', ['F082'], (m) => {
    assert.equal(m.extrairSiglas(blocos).filter((s) => s.sigla === 'CCEE').length, 1);
  });
});
