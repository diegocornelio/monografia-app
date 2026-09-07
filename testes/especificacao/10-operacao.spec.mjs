// 10-operacao.spec.mjs — itens 97 a 99 do catálogo, mais as consequências de
// não existir servidor de aplicação. Estas são as suítes que impedem os
// paliativos do §12 de virarem incidente silencioso.
import assert from 'node:assert/strict';
import { suite, caso, pendente } from '../runner.mjs';

const t = (dia, hora = '10') => `2026-09-${String(dia).padStart(2, '0')}T${hora}:00:00Z`;

suite('Ping de atividade contra a pausa por inatividade', { modulo: () => import('../../src/domain/operacao/ping.mjs') }, () => {
  caso('o intervalo e de tres dias, com margem para duas falhas seguidas', ['F097'], (m) => {
    assert.equal(m.INTERVALO_DIAS, 3);
    assert.equal(m.LIMITE_PAUSA_DIAS, 7);
    assert.equal(m.INTERVALO_DIAS * 2 < m.LIMITE_PAUSA_DIAS, true);
  });

  caso('sem ping recente, deve enviar', ['F097'], (m) => {
    assert.equal(m.devePingar({ ultimoPing: t(1), agora: t(5) }).enviar, true);
  });

  caso('com ping de ontem, nao deve enviar', ['F097'], (m) => {
    assert.equal(m.devePingar({ ultimoPing: t(4), agora: t(5) }).enviar, false);
  });

  caso('projeto novo, sem nenhum ping registrado, envia', ['F097'], (m) => {
    assert.equal(m.devePingar({ ultimoPing: null, agora: t(5) }).enviar, true);
  });

  caso('a requisicao de ping e minima e nao le dado de usuario', ['F097'], (m) => {
    const r = m.montarRequisicao();
    assert.equal(r.tabela, 'saude');
    assert.equal(r.operacao, 'upsert');
    assert.equal(r.linhas, 1);
    assert.equal(r.tocaDadosDeUsuario, false);
  });

  caso('o ping registra o proprio instante, que e o que o monitor le', ['F097', 'F099'], (m) => {
    const estado = m.registrarPing({ estado: {}, em: t(5) });
    assert.equal(estado.ultimoPing, t(5));
  });

  caso('o ping se declara paliativo, e nao backup nem protecao de cota', ['F097'], (m) => {
    assert.match(m.LIMITACOES.join(' '), /nao e backup/i);
    assert.match(m.LIMITACOES.join(' '), /egresso/i);
  });

  caso('o criterio de aposentadoria e explicito no codigo, nao so no documento', ['F097'], (m) => {
    assert.match(m.CRITERIO_APOSENTADORIA, /terceiro/i);
  });
});

suite('Monitor de cota e de estado', { modulo: () => import('../../src/domain/operacao/monitor.mjs') }, () => {
  caso('alerta aos oitenta por cento de qualquer cota', ['F099'], (m) => {
    const r = m.avaliar({ cotas: { bancoMb: { uso: 410, teto: 500 }, egressoGb: { uso: 1, teto: 5 } }, ultimoPing: t(5), agora: t(5) });
    assert.equal(r.alertas.some((a) => a.cota === 'bancoMb'), true);
    assert.equal(r.alertas.some((a) => a.cota === 'egressoGb'), false);
  });

  caso('alerta quando o ping envelhece alem de quatro dias', ['F097', 'F099'], (m) => {
    const r = m.avaliar({ cotas: {}, ultimoPing: t(1), agora: t(6) });
    assert.equal(r.alertas.some((a) => a.tipo === 'pingParado'), true);
  });

  caso('ping ausente e tratado como parado, e nao como saudavel', ['F099'], (m) => {
    const r = m.avaliar({ cotas: {}, ultimoPing: null, agora: t(6) });
    assert.equal(r.alertas.some((a) => a.tipo === 'pingParado'), true);
  });

  caso('estado saudavel nao gera alerta nenhum', ['F099'], (m) => {
    const r = m.avaliar({ cotas: { bancoMb: { uso: 100, teto: 500 } }, ultimoPing: t(5), agora: t(6) });
    assert.deepEqual(r.alertas, []);
  });

  caso('o alerta diz o modo de falha, porque cota estourada desliga em vez de degradar', ['F099'], (m) => {
    const r = m.avaliar({ cotas: { bancoMb: { uso: 480, teto: 500 } }, ultimoPing: t(5), agora: t(5) });
    assert.match(r.alertas[0].consequencia, /interrompe|desliga|pausa/i);
  });

  caso('o painel de operacao e visivel apenas ao administrador', ['F099', 'F053'], (m) => {
    assert.equal(m.podeVer({ papel: 'administrador' }), true);
    for (const papel of ['autor', 'orientador', 'leitor']) assert.equal(m.podeVer({ papel }), false);
  });
});

suite('Backup proprio semanal', { modulo: () => import('../../src/domain/operacao/backup.mjs') }, () => {
  caso('o backup e o mesmo pacote zip que o app ja exporta, sem formato novo', ['F098', 'F012'], (m) => {
    const b = m.montarBackup({ projeto: { id: 'p1', nome: 'GRID' }, em: t(7) });
    assert.equal(b.formato, 'zip');
    assert.deepEqual(b.conteudo.sort(), ['manifest.json', 'projeto.xml', 'recursos'].sort());
  });

  caso('o destino e a pasta do projeto no Drive do proprio usuario', ['F098'], (m) => {
    assert.equal(m.montarBackup({ projeto: { id: 'p1', nome: 'GRID' }, em: t(7) }).destino, 'drive:/Fichario/GRID/backups');
  });

  caso('a cadencia e semanal e a janela de perda declarada e de ate sete dias', ['F098'], (m) => {
    assert.equal(m.CADENCIA_DIAS, 7);
    assert.match(m.JANELA_DE_PERDA, /sete dias|7 dias/i);
  });

  caso('restaurar usa o importador normal, e nao um caminho proprio', ['F098', 'F012'], (m) => {
    assert.equal(m.caminhoDeRestauracao(), 'importarPacote');
  });

  caso('backup que nao confere com o manifesto e recusado antes de substituir o anterior', ['F098'], (m) => {
    assert.throws(() => m.aceitarBackup({ manifestoConfere: false, anterior: { id: 'b1' } }));
  });

  caso('os backups anteriores seguem a janela de cinco, como o resto do sistema', ['F098', 'F059'], (m) => {
    let lista = [];
    for (let i = 1; i <= 7; i += 1) lista = m.rotacionar({ lista, novo: { id: `b${i}` } });
    assert.equal(lista.length, 5);
    assert.equal(lista[0].id, 'b3');
  });
});

suite('Sem servidor de aplicacao, a politica de linha e a barreira unica', { modulo: () => import('../../src/domain/acesso/politica.mjs') }, () => {
  caso('a chave publicada no cliente nao carrega privilegio algum', ['F049', 'F048'], (m) => {
    assert.equal(m.CHAVE_CLIENTE.tipo, 'anonima');
    assert.equal(m.CHAVE_CLIENTE.confereAutorizacao, false);
  });

  caso('nenhuma chave de servico pode aparecer no bundle do front', ['F048'], (m) => {
    assert.throws(() => m.validarBundle({ variaveis: { SUPABASE_SERVICE_ROLE_KEY: 'x' } }));
    assert.doesNotThrow(() => m.validarBundle({ variaveis: { VITE_SUPABASE_ANON_KEY: 'x' } }));
  });

  caso('regra de autorizacao declarada apenas na interface e recusada', ['F048', 'F067'], (m) => {
    const r = m.conferirParidade({
      regrasNaInterface: ['orientador nao edita bloco'],
      politicasNoBanco: [],
    });
    assert.equal(r.valido, false);
    assert.deepEqual(r.semEspelhoNoBanco, ['orientador nao edita bloco']);
  });

  caso('toda tabela de conteudo tem politica, senao o build do esquema falha', ['F049'], (m) => {
    assert.throws(() => m.validarEsquema({ tabelas: [{ nome: 'blocos', politicas: [] }] }));
  });

  caso('cliente HTTP direto, sem a interface, respeita a mesma politica', ['F049'], () => {
    pendente('teste de integracao contra instancia real: entra no CI da Fase 5');
  });
});
