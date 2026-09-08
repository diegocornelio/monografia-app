// 09-multiusuario.spec.mjs — Fase 5. R4 do plano vive aqui: o orientador nao ve
// a orquestracao de IA porque a rota nao existe para ele e o backend recusa, e
// nao porque a interface escondeu botao.
import assert from 'node:assert/strict';
import { suite, caso, pendente } from '../runner.mjs';

suite('Papeis e capacidades', { modulo: () => import('../../src/domain/acesso/papeis.mjs') }, () => {
  caso('os quatro papeis existem', ['F066'], (m) => {
    assert.deepEqual([...m.PAPEIS].sort(), ['administrador', 'autor', 'leitor', 'orientador']);
  });

  caso('somente o autor edita conteudo do documento', ['F067'], (m) => {
    assert.equal(m.pode({ papel: 'autor', acao: 'editarBloco' }), true);
    for (const p of ['orientador', 'leitor', 'administrador']) {
      assert.equal(m.pode({ papel: p, acao: 'editarBloco' }), false, `${p} nao pode editar`);
    }
  });

  caso('orientador e leitor comentam; administrador nao', ['F067'], (m) => {
    assert.equal(m.pode({ papel: 'orientador', acao: 'comentar' }), true);
    assert.equal(m.pode({ papel: 'leitor', acao: 'comentar' }), true);
    assert.equal(m.pode({ papel: 'administrador', acao: 'comentar' }), false);
  });

  caso('validar e arquivar tarefa e de orientador e autor apenas', ['F070'], (m) => {
    for (const acao of ['validarTarefa', 'arquivarTarefa']) {
      assert.equal(m.pode({ papel: 'orientador', acao }), true);
      assert.equal(m.pode({ papel: 'autor', acao }), true);
      assert.equal(m.pode({ papel: 'leitor', acao }), false);
    }
  });

  caso('o administrador nunca le conteudo de projeto', ['F053'], (m) => {
    assert.equal(m.pode({ papel: 'administrador', acao: 'lerConteudo' }), false);
  });

  caso('convidado nao convida convidado', ['F066'], (m) => {
    assert.equal(m.pode({ papel: 'autor', acao: 'convidar' }), true);
    assert.equal(m.pode({ papel: 'orientador', acao: 'convidar' }), false);
  });
});

suite('Isolamento da orquestracao de IA', { modulo: () => import('../../src/domain/acesso/rotas.mjs') }, () => {
  const rotasDeAgente = ['/agente', '/agente/chaves', '/agente/prompts', '/agente/custos', '/agente/auditoria'];

  caso('rota protegida sem usuario confirmado redireciona para entrada', ['F049', 'F066'], (m) => {
    assert.deepEqual(m.protegerRota({ rota: '/app', usuario: null }), {
      permitido: false,
      status: 302,
      destino: '/entrar',
      motivo: 'sessaoAusente',
    });
  });

  caso('usuario autenticado acessa rota protegida de trabalho', ['F049', 'F066'], (m) => {
    assert.deepEqual(m.protegerRota({ rota: '/app', usuario: { id: 'u1', email: 'diego@example.com' } }), {
      permitido: true,
      status: 200,
    });
  });

  caso('paginas de entrada continuam publicas para criar sessao', ['F066'], (m) => {
    for (const rota of ['/entrar', '/cadastrar', '/auth/callback']) {
      assert.equal(m.protegerRota({ rota, usuario: null }).permitido, true, rota);
    }
  });

  caso('nenhuma rota de agente e resolvida para orientador ou leitor', ['F067'], (m) => {
    for (const papel of ['orientador', 'leitor']) {
      for (const rota of rotasDeAgente) {
        assert.equal(m.resolver({ papel, rota }).permitido, false, `${papel} em ${rota}`);
      }
    }
  });

  caso('a recusa e do backend, com codigo, e nao ocultacao visual', ['F067'], (m) => {
    const r = m.resolver({ papel: 'orientador', rota: '/agente/chaves' });
    assert.equal(r.status, 403);
    assert.equal(r.motivo, 'papelSemCapacidade');
    assert.equal(r.ocultacaoVisual, false);
  });

  caso('a view do orientador expoe apenas documentos, referencias, progresso e tarefas', ['F067', 'R5'], (m) => {
    assert.deepEqual(m.rotasDoPapel('orientador').sort(), [
      '/orientacao/:projetoId/documentos',
      '/orientacao/:projetoId/progresso',
      '/orientacao/:projetoId/referencias',
      '/orientacao/:projetoId/tarefas',
    ]);
  });

  caso('nenhum dado de agente entra na consulta que monta a view do orientador', ['F067'], (m) => {
    const consulta = m.consultaDaView({ papel: 'orientador', projetoId: 'p1' });
    const proibidas = ['chaves', 'prompts', 'auditoriaIA', 'skills', 'voz', 'custos'];
    for (const t of proibidas) assert.equal(consulta.tabelas.includes(t), false, `vazou ${t}`);
  });

  caso('a declaracao de uso de IA e peca academica e pode ser publicada pelo autor', ['F046', 'F067'], (m) => {
    const r = m.resolver({ papel: 'orientador', rota: '/orientacao/:projetoId/declaracao-ia', publicada: true });
    assert.equal(r.permitido, true);
  });

  caso('sem publicacao pelo autor, nem a declaracao aparece', ['F067'], (m) => {
    assert.equal(m.resolver({ papel: 'orientador', rota: '/orientacao/:projetoId/declaracao-ia', publicada: false }).permitido, false);
  });
});

suite('Convite e revogacao', { modulo: () => import('../../src/domain/acesso/convite.mjs') }, () => {
  caso('convite nasce com papel, validade e projeto', ['F066'], (m) => {
    const c = m.criarConvite({ projetoId: 'p1', email: 'orientador@usp.br', papel: 'orientador', em: '2026-09-07T10:00:00Z' });
    assert.equal(c.papel, 'orientador');
    assert.equal(new Date(c.expiraEm) > new Date(c.criadoEm), true);
  });

  caso('convite expirado nao autentica', ['F066'], (m) => {
    const c = { expiraEm: '2026-01-01T00:00:00Z', revogadoEm: null };
    assert.equal(m.validarConvite({ convite: c, agora: '2026-09-07T10:00:00Z' }).valido, false);
  });

  caso('revogacao corta sessao ja aberta, e nao apenas novo acesso', ['F066'], (m) => {
    const r = m.revogar({ convite: { id: 'c1' }, sessoesAtivas: [{ id: 's1', conviteId: 'c1' }], em: '2026-09-07T12:00:00Z' });
    assert.deepEqual(r.sessoesEncerradas, ['s1']);
  });

  caso('papel de convite fora da lista e recusado', ['F066'], (m) => {
    assert.throws(() => m.criarConvite({ projetoId: 'p', email: 'x@y', papel: 'coautor' }));
  });

  caso('o autor ve quem acessou e quando', ['F073'], (m) => {
    const log = m.registrarAcesso({ historico: [], conviteId: 'c1', em: '2026-09-07T12:00:00Z' });
    assert.equal(log.length, 1);
    assert.equal(log[0].conviteId, 'c1');
  });

  caso('um projeto aceita mais de um orientador e mais de um leitor', ['F066'], (m) => {
    const r = m.aceitaMais({ convites: [{ papel: 'orientador' }, { papel: 'leitor' }], novo: 'orientador' });
    assert.equal(r, true);
  });
});

suite('Isolamento por linha no banco', { modulo: () => import('../../src/infrastructure/supabase/politicas.mjs') }, () => {
  caso('toda tabela de conteudo tem politica por usuario', ['F049'], (m) => {
    for (const tabela of m.TABELAS_DE_CONTEUDO) {
      assert.equal(m.temPolitica(tabela), true, `${tabela} sem politica`);
    }
  });

  caso('usuario A nao le linha de B, provado contra o banco real', ['F049'], () => {
    pendente('teste de integracao: exige instancia Supabase de teste, entra no CI da Fase 5');
  });

  caso('papel orientador le documento do projeto convidado e nada alem dele', ['F049'], () => {
    pendente('teste de integracao: exige instancia Supabase de teste, entra no CI da Fase 5');
  });
});

suite('Cobrança e ciclo de assinatura', { modulo: () => import('../../src/application/portas/pagamento.mjs') }, () => {
  caso('a porta de pagamento nao vaza provedor para o dominio', ['F050'], (m) => {
    assert.deepEqual(Object.keys(m.CONTRATO_PAGAMENTO).sort(), [
      'assinar', 'cancelar', 'consultarAssinatura', 'reativar', 'tratarWebhook',
    ].sort());
  });

  caso('webhook repetido nao cobra nem libera duas vezes', ['F050'], (m) => {
    const evento = { id: 'evt_1', tipo: 'pagamentoConfirmado' };
    const estado = m.tratarWebhook({ eventos: [], evento });
    const repetido = m.tratarWebhook({ eventos: estado.eventos, evento });
    assert.equal(repetido.aplicado, false);
  });

  caso('assinatura vencida degrada o plano sem apagar dado do usuario', ['F050', 'F051'], (m) => {
    const r = m.aplicarInadimplencia({ plano: 'pesquisador', projetos: 4 });
    assert.equal(r.plano, 'gratis');
    assert.equal(r.projetosPreservados, 4);
    assert.equal(r.exportacaoLiberada, true);
  });

  caso('exclusao de conta revoga token do Drive e apaga o indice', ['F051'], (m) => {
    const r = m.excluirConta({ usuarioId: 'u1' });
    assert.equal(r.tokenRevogado, true);
    assert.equal(r.indiceApagado, true);
    assert.equal(r.arquivosDoUsuarioNoDrive, 'preservados');
  });
});
