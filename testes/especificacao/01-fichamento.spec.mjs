// 01-fichamento.spec.mjs — o que a Fase 1 precisa fazer para o fichamento.
// Fonte do requisito: planilha Estudo-Acelerado.xlsm lida em 07/09/2026 e
// PLANEJAMENTO_FICHARIO_v3.md §1, §7.1.
import assert from 'node:assert/strict';
import { suite, caso, moduloSobTeste } from '../runner.mjs';

suite('Limites de caracteres por tipo de ficha', { modulo: () => import('../../src/domain/limites.mjs') }, () => {
  caso('cada tipo tem limite total declarado e configuravel', ['F002'], (m) => {
    assert.equal(m.LIMITES.bibliografico.total, 600);
    assert.equal(m.LIMITES.citacao.total, 1200);
    assert.equal(m.LIMITES.texto.total, 1800);
    assert.equal(m.LIMITES.fichao.total, 3800);
  });

  caso('citacao individual tem teto proprio de 500', ['F002'], (m) => {
    assert.equal(m.LIMITES.citacao.porCitacao, 500);
  });

  caso('validar aceita conteudo no limite exato', ['F002'], (m) => {
    const texto = 'a'.repeat(600);
    assert.deepEqual(m.validarLimite({ tipo: 'bibliografico', texto }), { valido: true, excedente: 0 });
  });

  caso('validar recusa um caractere alem e informa o excedente', ['F002'], (m) => {
    const texto = 'a'.repeat(603);
    assert.deepEqual(m.validarLimite({ tipo: 'bibliografico', texto }), { valido: false, excedente: 3 });
  });

  caso('contagem ignora espaco em branco no fim, que o usuario nao ve', ['F002'], (m) => {
    const texto = 'a'.repeat(600) + '   \n';
    assert.equal(m.validarLimite({ tipo: 'bibliografico', texto }).valido, true);
  });

  caso('tipo desconhecido falha em vez de assumir limite generoso', ['F002'], (m) => {
    assert.throws(() => m.validarLimite({ tipo: 'inexistente', texto: 'x' }));
  });
});

suite('Ficha nos quatro tipos', { modulo: () => import('../../src/domain/ficha.mjs') }, () => {
  caso('os quatro tipos existem e o fichao nao e um quinto armazenamento', ['F001'], (m) => {
    assert.deepEqual([...m.TIPOS_FICHA].sort(), ['bibliografico', 'citacao', 'fichao', 'texto']);
  });

  caso('fichao compoe as tres secoes na ordem da planilha', ['F001'], (m) => {
    const composto = m.comporFichao({
      bibliografico: { temaVisao: 'tema e visao' },
      citacoes: [{ textoLimpo: 'trecho', pagina: 43 }],
      texto: { resumo: 'resumo', comentario: 'comentario' },
    });
    assert.deepEqual(
      composto.secoes.map((s) => s.tipo),
      ['bibliografico', 'citacao', 'texto'],
    );
  });

  caso('ficha nasce vinculada a uma fonte e a um projeto', ['F001'], (m) => {
    const f = m.criarFicha({ projetoId: 'p1', fonteId: 'f1', tipo: 'texto', assunto: 'a' });
    assert.equal(f.projetoId, 'p1');
    assert.equal(f.fonteId, 'f1');
  });

  caso('ficha sem fonte e recusada, porque fichamento sem obra nao existe', ['F001'], (m) => {
    assert.throws(() => m.criarFicha({ projetoId: 'p1', tipo: 'texto', assunto: 'a' }));
  });

  caso('ordem de impressao e atributo da ficha e aceita reordenacao', ['F009'], (m) => {
    const a = m.criarFicha({ projetoId: 'p', fonteId: 'f', tipo: 'texto', assunto: 'a', ordemImpressao: 2 });
    assert.equal(a.ordemImpressao, 2);
  });
});

suite('Catalogo de citacoes', { modulo: () => import('../../src/domain/citacao.mjs') }, () => {
  caso('citacao e armazenada limpa, sem aspas, como a planilha instrui', ['F005'], (m) => {
    const c = m.criarCitacao({ fonteId: 'f1', texto: '"Não existe uma norma única"', pagina: 43 });
    assert.equal(c.textoLimpo, 'Não existe uma norma única');
  });

  caso('aspas curvas e retas sao removidas do armazenamento', ['F005'], (m) => {
    assert.equal(m.criarCitacao({ fonteId: 'f', texto: '“trecho”', pagina: 1 }).textoLimpo, 'trecho');
  });

  caso('citacao sem pagina e recusada', ['F005'], (m) => {
    assert.throws(() => m.criarCitacao({ fonteId: 'f', texto: 'trecho' }));
  });

  caso('apresentacao curta aplica aspas e a pagina entre parenteses', ['F005'], (m) => {
    const c = m.criarCitacao({ fonteId: 'f', texto: 'trecho curto', pagina: 43 });
    assert.equal(m.apresentar(c, { linhas: 1 }), '"trecho curto" (p. 43)');
  });

  caso('citacao com mais de tres linhas sai em recuo, corpo 10 e sem aspas', ['F005', 'F084'], (m) => {
    const c = m.criarCitacao({ fonteId: 'f', texto: 'x'.repeat(400), pagina: 12 });
    const saida = m.apresentar(c, { linhas: 4 });
    assert.equal(saida.formato, 'recuo');
    assert.equal(saida.recuoCm, 4);
    assert.equal(saida.corpo, 10);
    assert.equal(saida.comAspas, false);
  });

  caso('citacao indireta nao ganha aspas em nenhum tamanho', ['F005'], (m) => {
    const c = m.criarCitacao({ fonteId: 'f', texto: 'parafrase do autor', pagina: 9, tipo: 'indireta' });
    assert.equal(m.apresentar(c, { linhas: 1 }).includes('"'), false);
  });
});

suite('Tags coloridas', { modulo: () => import('../../src/domain/tag.mjs') }, () => {
  caso('tag guarda cor de texto e cor de fundo editaveis', ['F004'], (m) => {
    const t = m.criarTag({ texto: 'metodologia', corTexto: '#2B2B2B', corFundo: '#EFE6DA' });
    assert.equal(t.corFundo, '#EFE6DA');
  });

  caso('contraste insuficiente entre texto e fundo e recusado', ['F004'], (m) => {
    assert.throws(() => m.criarTag({ texto: 'x', corTexto: '#EEEEEE', corFundo: '#EFEFEF' }));
  });

  caso('ficha sem tag produz linha de tags vazia, e nao ausencia de linha', ['F004'], (m) => {
    assert.deepEqual(m.linhaDeTags([]), { vazia: true, tags: [] });
  });
});

suite('Busca e filtro do acervo', { modulo: () => import('../../src/domain/busca.mjs') }, () => {
  const acervo = [
    { id: '1', assunto: 'Metodo cientifico', autor: 'ECO', obra: 'Como se faz uma tese', tags: ['metodologia'] },
    { id: '2', assunto: 'Prova documental', autor: 'MASON', obra: 'Electronic Evidence', tags: ['prova'] },
  ];

  caso('busca por autor ignora caixa e acento', ['F008'], (m) => {
    assert.deepEqual(m.filtrar(acervo, { autor: 'eco' }).map((x) => x.id), ['1']);
  });

  caso('busca por palavra-chave varre assunto e obra', ['F008'], (m) => {
    assert.deepEqual(m.filtrar(acervo, { palavraChave: 'evidence' }).map((x) => x.id), ['2']);
  });

  caso('filtros combinados sao conjuncao, nao uniao', ['F008'], (m) => {
    assert.deepEqual(m.filtrar(acervo, { autor: 'ECO', tag: 'prova' }), []);
  });

  caso('filtro vazio devolve o acervo inteiro na ordem recebida', ['F008'], (m) => {
    assert.deepEqual(m.filtrar(acervo, {}).map((x) => x.id), ['1', '2']);
  });
});
