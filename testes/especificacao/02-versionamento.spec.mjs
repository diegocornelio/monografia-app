// 02-versionamento.spec.mjs — R13 e R14 do plano: tudo editavel, removivel,
// salvo, com cinco versoes de volta. O modulo historico ja existe, entao esta
// suite roda verde e serve de teste de aceitacao, nao so de unidade.
import assert from 'node:assert/strict';
import { suite, caso, pendente } from '../runner.mjs';

const t = (n) => `2026-09-07T10:${String(n).padStart(2, '0')}:00Z`;

suite('Janela de cinco versoes', { modulo: () => import('../../src/domain/historico.mjs') }, () => {
  const editar = (m, n) => {
    let v = m.criarVersionado('v0');
    for (let i = 1; i <= n; i += 1) {
      v = m.registrarEdicao({ versionado: v, novoEstado: `v${i}`, quem: 'diego', quando: t(i) });
    }
    return v;
  };

  caso('a janela e de exatamente cinco versoes anteriores', ['F059'], (m) => {
    assert.equal(m.MAX_VERSOES, 5);
    assert.equal(editar(m, 12).versoes.length, 5);
  });

  caso('a sexta atualizacao descarta a mais antiga e preserva a ordem', ['F059'], (m) => {
    const seis = editar(m, 6);
    assert.deepEqual(seis.versoes.map((x) => x.estado), ['v1', 'v2', 'v3', 'v4', 'v5']);
    assert.equal(seis.atual, 'v6');
  });

  caso('qualquer uma das cinco pode ser retornada', ['F059'], (m) => {
    const v = editar(m, 5);
    for (let i = 0; i < 5; i += 1) {
      const r = m.restaurar({ versionado: v, indice: i, quem: 'diego', quando: t(9) });
      assert.equal(r.atual, `v${i}`);
    }
  });

  caso('restaurar empurra o estado corrente para dentro da janela', ['F059'], (m) => {
    const r = m.restaurar({ versionado: editar(m, 5), indice: 0, quem: 'diego', quando: t(9) });
    assert.equal(r.versoes.at(-1).estado, 'v5');
  });

  caso('cada versao registra quem editou e quando', ['F061'], (m) => {
    const v = editar(m, 2);
    assert.equal(v.versoes[0].quem, 'diego');
    assert.match(v.versoes[0].quando, /^2026-09-07T/);
  });

  caso('a listagem para a interface vem da mais recente para a mais antiga', ['F061'], (m) => {
    const lista = m.listarVersoes(editar(m, 3));
    assert.equal(lista.length, 3);
    assert.equal(lista[0].indice, 2);
  });

  caso('indice inexistente lanca em vez de devolver silencio', ['F059'], (m) => {
    assert.throws(() => m.restaurar({ versionado: editar(m, 2), indice: 7, quem: 'd', quando: t(1) }));
  });

  caso('nenhuma funcao muta o objeto recebido', ['F059'], (m) => {
    const original = editar(m, 3);
    const copia = structuredClone(original);
    m.registrarEdicao({ versionado: original, novoEstado: 'x', quem: 'd', quando: t(1) });
    m.remover({ versionado: original, quando: t(1) });
    assert.deepEqual(original, copia);
  });
});

suite('Aviso de descarte da proxima gravacao', { modulo: () => import('../../src/domain/historico.mjs') }, () => {
  caso('com janela cheia, o app sabe dizer qual versao sai na proxima', ['F062'], (m) => {
    if (typeof m.proximaADescartar !== 'function') pendente('proximaADescartar ainda nao existe');
    let v = m.criarVersionado('v0');
    for (let i = 1; i <= 5; i += 1) {
      v = m.registrarEdicao({ versionado: v, novoEstado: `v${i}`, quem: 'd', quando: t(i) });
    }
    assert.deepEqual(m.proximaADescartar(v), { estado: 'v0', quando: t(1) });
  });

  caso('com janela incompleta, nada sera descartado', ['F062'], (m) => {
    if (typeof m.proximaADescartar !== 'function') pendente('proximaADescartar ainda nao existe');
    const v = m.registrarEdicao({
      versionado: m.criarVersionado('v0'),
      novoEstado: 'v1',
      quem: 'd',
      quando: t(1),
    });
    assert.equal(m.proximaADescartar(v), null);
  });
});

suite('Remocao reversivel e lixeira', { modulo: () => import('../../src/domain/historico.mjs') }, () => {
  caso('remover marca e data, sem apagar conteudo nem historico', ['F060'], (m) => {
    let v = m.criarVersionado('conteudo');
    v = m.registrarEdicao({ versionado: v, novoEstado: 'conteudo 2', quem: 'd', quando: t(1) });
    const removido = m.remover({ versionado: v, quando: t(2) });
    assert.equal(removido.removido, true);
    assert.equal(removido.removidoEm, t(2));
    assert.equal(removido.atual, 'conteudo 2');
    assert.equal(removido.versoes.length, 1);
  });

  caso('restaurar da lixeira devolve a entidade intacta', ['F060'], (m) => {
    const v = m.remover({ versionado: m.criarVersionado('x'), quando: t(1) });
    const voltou = m.restaurarRemocao({ versionado: v });
    assert.equal(voltou.removido, false);
    assert.equal(voltou.removidoEm, null);
  });
});

suite('Cascata de remocao e expurgo', { modulo: () => import('../../src/domain/lixeira.mjs') }, () => {
  caso('remover fonte com fichas vinculadas devolve a lista de afetadas', ['F060'], (m) => {
    const efeito = m.analisarRemocao({
      alvo: { tipo: 'fonte', id: 'f1' },
      vinculos: [
        { tipo: 'ficha', id: 'c1', fonteId: 'f1' },
        { tipo: 'ficha', id: 'c2', fonteId: 'f2' },
        { tipo: 'citacao', id: 'q1', fonteId: 'f1' },
      ],
    });
    assert.deepEqual(efeito.afetados.map((x) => x.id).sort(), ['c1', 'q1']);
    assert.equal(efeito.exigeDecisao, true);
  });

  caso('nenhuma cascata acontece sem decisao explicita do usuario', ['F060'], (m) => {
    assert.throws(() => m.aplicarRemocao({ alvo: { tipo: 'fonte', id: 'f1' }, decisao: undefined }));
  });

  caso('manter fichas orfas registra pendencia de referencia em cada uma', ['F060'], (m) => {
    const r = m.aplicarRemocao({
      alvo: { tipo: 'fonte', id: 'f1' },
      afetados: [{ tipo: 'ficha', id: 'c1' }],
      decisao: 'manterOrfas',
    });
    assert.equal(r.afetados[0].referenciaPendente, true);
  });

  caso('expurgo exige confirmacao que nomeia o que sera destruido', ['F060'], (m) => {
    assert.throws(() => m.expurgar({ itens: [{ id: 'c1' }], confirmacao: null }));
    const ok = m.expurgar({ itens: [{ id: 'c1' }], confirmacao: { textoLido: true, quantidade: 1 } });
    assert.equal(ok.destruidos, 1);
  });
});

suite('Autosave que nao gasta janela a toa', { modulo: () => import('../../src/domain/autosave.mjs') }, () => {
  caso('salvar sem mudanca de conteudo nao grava versao', ['F019', 'F059'], (m) => {
    const estado = { blocos: [{ id: 'b1', texto: 'a' }] };
    const primeiro = m.avaliarSalvamento({ estado, ultimoHash: null });
    assert.equal(primeiro.gravar, true);
    const segundo = m.avaliarSalvamento({ estado, ultimoHash: primeiro.hash });
    assert.equal(segundo.gravar, false);
  });

  caso('mudanca minima de conteudo gera hash diferente', ['F019'], (m) => {
    const a = m.avaliarSalvamento({ estado: { t: 'a' }, ultimoHash: null });
    const b = m.avaliarSalvamento({ estado: { t: 'b' }, ultimoHash: a.hash });
    assert.equal(b.gravar, true);
  });

  caso('salvamento explicito do usuario grava mesmo sem mudanca', ['F019'], (m) => {
    const a = m.avaliarSalvamento({ estado: { t: 'a' }, ultimoHash: null });
    const b = m.avaliarSalvamento({ estado: { t: 'a' }, ultimoHash: a.hash, explicito: true });
    assert.equal(b.gravar, true);
  });

  caso('intervalo padrao e dez minutos e e configuravel', ['F019'], (m) => {
    assert.equal(m.INTERVALO_PADRAO_MIN, 10);
    assert.equal(m.normalizarIntervalo(0).ligado, false);
  });
});
