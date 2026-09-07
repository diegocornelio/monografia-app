// 05-acervo.spec.mjs — Fase 2: ingestao de referencias, integridade do acervo
// e cofre no Drive. Todo acesso a rede e feito por porta, e os testes usam
// adaptador falso: teste que depende de rede nao e teste, e sim monitoramento.
import assert from 'node:assert/strict';
import { suite, caso } from '../runner.mjs';

suite('Importacao BibTeX e RIS', { modulo: () => import('../../src/domain/acervo/importadores.mjs') }, () => {
  const bib = `@book{eco1995,
  author = {Umberto Eco},
  title = {Como se faz uma tese em Ci{\\^e}ncias Humanas},
  edition = {6},
  address = {Lisboa},
  publisher = {Editorial Presen{\\c{c}}a},
  year = {1995}
}`;

  caso('bibtex vira fonte com campos estruturados', ['F015'], (m) => {
    const [f] = m.lerBibTeX(bib);
    assert.equal(f.autorSobrenome, 'Eco');
    assert.equal(f.ano, 1995);
    assert.equal(f.edicao, 6);
  });

  caso('acentuacao em notacao TeX e convertida', ['F015'], (m) => {
    const [f] = m.lerBibTeX(bib);
    assert.equal(f.titulo, 'Como se faz uma tese em Ciências Humanas');
    assert.equal(f.editora, 'Editorial Presença');
  });

  caso('entrada RIS de artigo vira fonte de tipo artigo', ['F015'], (m) => {
    const ris = 'TY  - JOUR\nAU  - Silva, Ana\nTI  - Rastreabilidade\nPY  - 2021\nJO  - Revista\nER  -';
    const [f] = m.lerRIS(ris);
    assert.equal(f.tipoFonte, 'artigo');
    assert.equal(f.periodico, 'Revista');
  });

  caso('entrada invalida nao derruba a importacao das demais', ['F015'], (m) => {
    const r = m.lerBibTeX(`${bib}\n@book{quebrado,`);
    assert.equal(r.length, 1);
  });

  caso('a importacao devolve relatorio com aceitas e recusadas', ['F015'], (m) => {
    const rel = m.importar({ conteudo: bib, formato: 'bibtex' });
    assert.equal(rel.aceitas.length, 1);
    assert.equal(Array.isArray(rel.recusadas), true);
  });
});

suite('Deduplicacao de fontes', { modulo: () => import('../../src/domain/acervo/dedup.mjs') }, () => {
  const acervo = [{ id: 'f1', doi: '10.1/abc', titulo: 'Como se faz uma tese', ano: 1995 }];

  caso('doi igual e duplicata, mesmo com titulo diferente', ['F075'], (m) => {
    const r = m.avaliar(acervo, { doi: '10.1/ABC', titulo: 'Outro titulo' });
    assert.equal(r.duplicada, true);
    assert.equal(r.criterio, 'doi');
  });

  caso('titulo normalizado e ano iguais indicam duplicata provavel', ['F075'], (m) => {
    const r = m.avaliar(acervo, { titulo: 'COMO SE FAZ UMA TESE', ano: 1995 });
    assert.equal(r.duplicada, true);
    assert.equal(r.criterio, 'tituloAno');
  });

  caso('titulo parecido com ano diferente nao e duplicata', ['F075'], (m) => {
    assert.equal(m.avaliar(acervo, { titulo: 'Como se faz uma tese', ano: 2016 }).duplicada, false);
  });

  caso('a decisao final e do usuario: dedup sugere, nao apaga', ['F075'], (m) => {
    const r = m.avaliar(acervo, { doi: '10.1/abc' });
    assert.equal(r.acaoAutomatica, false);
    assert.equal(r.sugestao, 'mesclar');
  });
});

suite('Busca de referencia por identificador', { modulo: () => import('../../src/domain/acervo/identificadores.mjs') }, () => {
  const clienteFalso = {
    async porDoi(doi) {
      if (doi !== '10.1/abc') throw new Error('nao encontrado');
      return { titulo: 'Obra', ano: 2021, autores: [{ sobrenome: 'SILVA', nome: 'Ana' }] };
    },
  };

  caso('doi valido preenche os campos da fonte', ['F074'], async (m) => {
    const f = await m.buscarPorDoi({ doi: '10.1/abc', cliente: clienteFalso });
    assert.equal(f.titulo, 'Obra');
    assert.equal(f.origemMetadados, 'crossref');
  });

  caso('doi nao encontrado devolve nulo e nao inventa referencia', ['F074'], async (m) => {
    assert.equal(await m.buscarPorDoi({ doi: '10.9/zzz', cliente: clienteFalso }), null);
  });

  caso('doi malformado nem chega a consultar a rede', ['F074'], async (m) => {
    let chamou = false;
    const espiao = { async porDoi() { chamou = true; } };
    await m.buscarPorDoi({ doi: 'nao-e-doi', cliente: espiao });
    assert.equal(chamou, false);
  });
});

suite('Integridade da fonte no tempo', { modulo: () => import('../../src/domain/acervo/integridade.mjs') }, () => {
  caso('estado de leitura aceita apenas os tres valores previstos', ['F077'], (m) => {
    assert.deepEqual([...m.ESTADOS_LEITURA].sort(), ['identificada', 'primaria', 'secundaria']);
    assert.throws(() => m.definirEstadoLeitura({ fonte: {}, estado: 'lido rapido' }));
  });

  caso('fonte apenas identificada nao pode sustentar citacao direta', ['F077'], (m) => {
    const r = m.podeSustentarCitacao({ estadoLeitura: 'identificada', tipoCitacao: 'direta' });
    assert.equal(r.pode, false);
  });

  caso('link morto e registrado com data e proposta de arquivamento', ['F076'], async (m) => {
    const r = await m.conferirLink({ url: 'https://x/y', cliente: { async status() { return 404; } } });
    assert.equal(r.vivo, false);
    assert.equal(r.sugereArquivar, true);
  });

  caso('url arquivada e guardada ao lado da original, sem substitui-la', ['F076'], (m) => {
    const f = m.registrarArquivamento({ fonte: { url: 'https://x/y' }, urlArquivada: 'https://web.archive.org/z' });
    assert.equal(f.url, 'https://x/y');
    assert.equal(f.urlArquivada, 'https://web.archive.org/z');
  });

  caso('artigo retratado gera alerta bloqueante ao exportar', ['F078'], async (m) => {
    const cliente = { async retratacao() { return { retratada: true, em: '2024-05-01' }; } };
    const r = await m.conferirRetratacao({ fonte: { doi: '10.1/abc' }, cliente });
    assert.equal(r.retratada, true);
    assert.equal(r.bloqueiaExport, true);
  });

  caso('consulta de retratacao indisponivel nao afirma que a fonte esta limpa', ['F078'], async (m) => {
    const cliente = { async retratacao() { throw new Error('fora do ar'); } };
    const r = await m.conferirRetratacao({ fonte: { doi: '10.1/abc' }, cliente });
    assert.equal(r.retratada, null);
    assert.equal(r.estado, 'indeterminado');
  });
});

suite('Cofre no Drive por porta', { modulo: () => import('../../src/application/portas/armazenamento.mjs') }, () => {
  caso('a porta expoe as operacoes que o app usa, e nada de Google vaza para o dominio', ['F017'], (m) => {
    assert.deepEqual(
      Object.keys(m.CONTRATO_ARMAZENAMENTO).sort(),
      ['apagar', 'baixar', 'criarPasta', 'enviar', 'linkDeVisualizacao', 'listar'].sort(),
    );
  });

  caso('sem token vinculado o app opera em modo local declarado', ['F017'], (m) => {
    const s = m.estadoDoCofre({ token: null });
    assert.equal(s.modo, 'local');
    assert.equal(s.avisoPersistente, true);
  });

  caso('token revogado degrada para local sem perder dado', ['F017'], (m) => {
    const s = m.estadoDoCofre({ token: { revogado: true }, dadosLocais: 12 });
    assert.equal(s.modo, 'local');
    assert.equal(s.perdaDeDados, false);
  });

  caso('conflito entre duas maquinas lista as duas versoes e nao sobrescreve', ['F018'], (m) => {
    const r = m.resolverConflito({
      local: { hash: 'a', em: '2026-09-07T10:00:00Z' },
      remoto: { hash: 'b', em: '2026-09-07T11:00:00Z' },
    });
    assert.equal(r.exigeDecisao, true);
    assert.equal(r.opcoes.length, 2);
    assert.equal(r.sobrescritaSilenciosa, false);
  });

  caso('a versao gravada no cofre e imutavel depois de escrita', ['F018'], (m) => {
    assert.throws(() => m.reescreverVersao({ id: 'v1' }));
  });
});
