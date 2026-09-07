// 04-intercambio.spec.mjs — XML do projeto, pacote zip e migracao de formato.
import assert from 'node:assert/strict';
import { suite, caso } from '../runner.mjs';

const projeto = {
  versao: '3.0',
  nome: 'GRID',
  fontes: [{ id: 'f01', doi: '10.1287/mnsc.2016.2468', titulo: 'Obra', estadoLeitura: 'primaria' }],
  tags: [{ id: 't1', texto: 'metodologia', corFundo: '#EFE6DA', corTexto: '#2B2B2B' }],
  fichas: [{ id: 'c01', tipo: 'fichao', fonteId: 'f01', ordemImpressao: 1, assunto: 'A', tags: ['t1'] }],
  citacoes: [{ id: 'q1', fonteId: 'f01', textoLimpo: 'trecho', pagina: 43 }],
  blocos: [{ id: 'b1', nivel: 1, tipo: 'textual', titulo: 'Introducao' }],
  comentarios: [],
  tarefas: [],
  versoes: [],
  auditoria: [],
};

suite('Serializacao XML do projeto', { modulo: () => import('../../src/domain/intercambio/xml.mjs') }, () => {
  caso('ida e volta preserva o projeto sem perda', ['F012'], (m) => {
    assert.deepEqual(m.deXml(m.paraXml(projeto)), projeto);
  });

  caso('a serializacao e deterministica: mesmo projeto, mesmo texto', ['F012'], (m) => {
    assert.equal(m.paraXml(projeto), m.paraXml(structuredClone(projeto)));
  });

  caso('a ordem das fichas na fila de impressao sobrevive ao round-trip', ['F009', 'F012'], (m) => {
    const p = { ...projeto, fichas: [
      { ...projeto.fichas[0], id: 'c02', ordemImpressao: 2 },
      { ...projeto.fichas[0], id: 'c01', ordemImpressao: 1 },
    ] };
    const volta = m.deXml(m.paraXml(p));
    assert.deepEqual(volta.fichas.map((f) => f.id), ['c02', 'c01']);
  });

  caso('caractere especial e acento sobrevivem ao escape', ['F012'], (m) => {
    const p = { ...projeto, nome: 'Ediçao & "aspas" <tag>' };
    assert.equal(m.deXml(m.paraXml(p)).nome, 'Ediçao & "aspas" <tag>');
  });

  caso('o formato declara a propria versao no no raiz', ['F012'], (m) => {
    assert.match(m.paraXml(projeto), /<fichario[^>]*versao="3\.0"/);
  });

  caso('os nos novos da versao 3 existem', ['F012', 'F069'], (m) => {
    const xml = m.paraXml(projeto);
    for (const no of ['comentarios', 'tarefas', 'versoes', 'auditoria']) {
      assert.match(xml, new RegExp(`<${no}`));
    }
  });

  caso('xml malformado e recusado com mensagem localizada', ['F012'], (m) => {
    assert.throws(() => m.deXml('<fichario><fontes></fichario>'), /linha/i);
  });
});

suite('Migracao de formatos anteriores', { modulo: () => import('../../src/domain/intercambio/migracao.mjs') }, () => {
  caso('projeto na versao 1.0 e migrado para 3.0 sem perder ficha', ['F012'], (m) => {
    const antigo = { versao: '1.0', fichas: [{ id: 'c1', tipo: 'texto' }] };
    const novo = m.migrar(antigo);
    assert.equal(novo.versao, '3.0');
    assert.equal(novo.fichas.length, 1);
  });

  caso('projeto na versao 2.0 ganha os nos novos vazios, e nao ausentes', ['F012'], (m) => {
    const novo = m.migrar({ versao: '2.0', fichas: [] });
    assert.deepEqual(novo.comentarios, []);
    assert.deepEqual(novo.tarefas, []);
  });

  caso('versao futura desconhecida e recusada em vez de adivinhada', ['F012'], (m) => {
    assert.throws(() => m.migrar({ versao: '9.9' }));
  });
});

suite('Pacote zip com manifesto', { modulo: () => import('../../src/domain/intercambio/pacote.mjs') }, () => {
  caso('o manifesto guarda hash de cada recurso', ['F012'], (m) => {
    const pacote = m.montarManifesto({
      recursos: [{ caminho: 'recursos/capa.png', bytes: new Uint8Array([1, 2, 3]) }],
    });
    assert.equal(pacote.recursos[0].hash.length, 64);
  });

  caso('recurso corrompido e rejeitado na importacao pelo manifesto', ['F012'], (m) => {
    const manifesto = m.montarManifesto({ recursos: [{ caminho: 'a.png', bytes: new Uint8Array([1]) }] });
    const conferencia = m.conferirManifesto({
      manifesto,
      recursos: [{ caminho: 'a.png', bytes: new Uint8Array([9]) }],
    });
    assert.equal(conferencia.valido, false);
    assert.deepEqual(conferencia.corrompidos, ['a.png']);
  });

  caso('recurso ausente e distinguido de recurso corrompido', ['F012'], (m) => {
    const manifesto = m.montarManifesto({ recursos: [{ caminho: 'a.png', bytes: new Uint8Array([1]) }] });
    const c = m.conferirManifesto({ manifesto, recursos: [] });
    assert.deepEqual(c.ausentes, ['a.png']);
    assert.deepEqual(c.corrompidos, []);
  });

  caso('o nome do arquivo segue o padrao com projeto, versao e data', ['F012'], (m) => {
    const nome = m.nomeDoPacote({ projeto: 'GRID', versao: '1.2.3', em: '2026-09-07T18:04:00Z' });
    assert.equal(nome, 'GRID_v1.2.3_2026-09-07T18-04.zip');
  });
});
