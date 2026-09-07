// testes.mjs — bateria executável das unidades críticas do plano.
// Roda com: node testes.mjs
import assert from 'node:assert/strict';
import {
  criarVersionado,
  registrarEdicao,
  restaurar,
  remover,
  restaurarRemocao,
  listarVersoes,
  MAX_VERSOES,
} from '../src/domain/historico.mjs';
import {
  criarTarefa,
  moverTarefa,
  transicoesPossiveis,
  resumoBacklog,
  listarParaRolagem,
} from '../src/domain/backlog.mjs';
import {
  adicionarCitacao,
  adicionarFicha,
  adicionarFigura,
  adicionarSecao,
  adicionarTabela,
  atualizarFicha,
  inserirCitacaoNaSecao,
  moverFicha,
  moverSecao,
  removerFicha,
  exportarProjeto,
  importarProjeto,
} from '../src/domain/projeto.mjs';
import { renumerar, mover } from '../src/domain/sumario.mjs';

let passou = 0;
const falhas = [];
function teste(nome, fn) {
  try {
    fn();
    passou += 1;
    console.log(`ok   ${nome}`);
  } catch (erro) {
    falhas.push({ nome, erro });
    console.log(`FALHA ${nome}: ${erro.message}`);
  }
}

const t = (n) => `2026-09-07T10:0${n}:00Z`;

function editarVezes(quantidade) {
  let v = criarVersionado('v0');
  for (let i = 1; i <= quantidade; i += 1) {
    v = registrarEdicao({ versionado: v, novoEstado: `v${i}`, quem: 'diego', quando: t(i % 10) });
  }
  return v;
}

// ---------- histórico ----------

teste('historico_guarda_no_maximo_cinco_versoes_anteriores', () => {
  const v = editarVezes(9);
  assert.equal(v.versoes.length, MAX_VERSOES);
});

teste('sexta_edicao_sobrescreve_a_versao_mais_antiga', () => {
  const cinco = editarVezes(5); // histórico: v0..v4
  assert.deepEqual(cinco.versoes.map((x) => x.estado), ['v0', 'v1', 'v2', 'v3', 'v4']);
  const seis = registrarEdicao({
    versionado: cinco,
    novoEstado: 'v6',
    quem: 'diego',
    quando: t(6),
  });
  assert.deepEqual(seis.versoes.map((x) => x.estado), ['v1', 'v2', 'v3', 'v4', 'v5']);
  assert.equal(seis.atual, 'v6');
});

teste('restaurar_versao_antiga_devolve_o_estado_e_preserva_o_corrente', () => {
  const v = editarVezes(5); // atual v5, histórico v0..v4
  const restaurado = restaurar({ versionado: v, indice: 0, quem: 'diego', quando: t(7) });
  assert.equal(restaurado.atual, 'v0');
  assert.equal(restaurado.versoes.at(-1).estado, 'v5');
  assert.equal(restaurado.versoes.length, MAX_VERSOES);
});

teste('restaurar_indice_inexistente_falha_em_vez_de_silenciar', () => {
  const v = editarVezes(2);
  assert.throws(() => restaurar({ versionado: v, indice: 9, quem: 'diego', quando: t(8) }));
});

teste('remocao_e_reversivel_ate_o_expurgo_explicito', () => {
  const v = remover({ versionado: editarVezes(1), quando: t(9) });
  assert.equal(v.removido, true);
  assert.equal(restaurarRemocao({ versionado: v }).removido, false);
});

teste('listagem_de_versoes_vem_da_mais_recente_para_a_mais_antiga', () => {
  const v = editarVezes(3);
  const lista = listarVersoes(v);
  assert.equal(lista[0].indice, v.versoes.length - 1);
});

teste('nenhuma_funcao_de_historico_muta_o_objeto_recebido', () => {
  const original = editarVezes(2);
  const copia = JSON.parse(JSON.stringify(original));
  registrarEdicao({ versionado: original, novoEstado: 'x', quem: 'a', quando: t(1) });
  remover({ versionado: original, quando: t(1) });
  assert.deepEqual(JSON.parse(JSON.stringify(original)), copia);
});

// ---------- backlog do orientador ----------

const base = () =>
  criarTarefa({
    id: 'T1',
    blocoId: 'b3',
    ancora: { inicio: 10, fim: 42 },
    comentario: 'a hipotese nao esta delimitada neste paragrafo',
    autor: 'orientador',
    quando: t(1),
  });

teste('comentario_do_orientador_nasce_como_tarefa_aberta_ancorada_no_bloco', () => {
  const tarefa = base();
  assert.equal(tarefa.estado, 'aberta');
  assert.equal(tarefa.blocoId, 'b3');
  assert.deepEqual(tarefa.ancora, { inicio: 10, fim: 42 });
});

teste('leitor_nao_valida_nem_arquiva_tarefa', () => {
  const emRevisao = moverTarefa({
    tarefa: moverTarefa({
      tarefa: moverTarefa({ tarefa: base(), para: 'em_atendimento', papel: 'orientado', quem: 'diego', quando: t(2) }),
      para: 'em_revisao',
      papel: 'orientado',
      quem: 'diego',
      quando: t(3),
    }),
    para: 'validada',
    papel: 'orientador',
    quem: 'calabro',
    quando: t(4),
  });
  assert.throws(() =>
    moverTarefa({ tarefa: emRevisao, para: 'arquivada', papel: 'leitor', quem: 'x', quando: t(5) }),
  );
  assert.deepEqual(transicoesPossiveis({ tarefa: emRevisao, papel: 'leitor' }), []);
});

teste('somente_orientador_ou_orientado_arquivam_tarefa_validada', () => {
  let tarefa = base();
  tarefa = moverTarefa({ tarefa, para: 'em_atendimento', papel: 'orientado', quem: 'diego', quando: t(2) });
  tarefa = moverTarefa({ tarefa, para: 'em_revisao', papel: 'orientado', quem: 'diego', quando: t(3) });
  tarefa = moverTarefa({ tarefa, para: 'validada', papel: 'orientado', quem: 'diego', quando: t(4) });
  const arquivada = moverTarefa({ tarefa, para: 'arquivada', papel: 'orientador', quem: 'calabro', quando: t(5) });
  assert.equal(arquivada.estado, 'arquivada');
});

teste('recusa_sem_motivo_e_rejeitada', () => {
  assert.throws(() =>
    moverTarefa({ tarefa: base(), para: 'recusada', papel: 'orientado', quem: 'diego', quando: t(2) }),
  );
});

teste('ciclo_de_otimizacao_registra_toda_passagem_de_estado', () => {
  let tarefa = base();
  tarefa = moverTarefa({ tarefa, para: 'em_atendimento', papel: 'orientado', quem: 'diego', quando: t(2) });
  tarefa = moverTarefa({ tarefa, para: 'em_revisao', papel: 'orientado', quem: 'diego', quando: t(3) });
  tarefa = moverTarefa({ tarefa, para: 'em_atendimento', papel: 'orientador', quem: 'calabro', quando: t(4), nota: 'ainda amplia' });
  assert.deepEqual(tarefa.ciclo.map((c) => c.estado), [
    'aberta',
    'em_atendimento',
    'em_revisao',
    'em_atendimento',
  ]);
});

teste('resumo_do_backlog_separa_pendentes_de_realizadas', () => {
  const a = base();
  let b = moverTarefa({ tarefa: { ...base(), id: 'T2' }, para: 'em_atendimento', papel: 'orientado', quem: 'diego', quando: t(2) });
  b = moverTarefa({ tarefa: b, para: 'em_revisao', papel: 'orientado', quem: 'diego', quando: t(3) });
  b = moverTarefa({ tarefa: b, para: 'validada', papel: 'orientador', quem: 'calabro', quando: t(4) });
  const resumo = resumoBacklog([a, b]);
  assert.deepEqual(resumo, { pendentes: 1, realizadas: 1, recusadas: 0, total: 2, percentual: 50 });
});

teste('listagem_rolavel_traz_o_que_espera_decisao_no_topo', () => {
  const aberta = base();
  let revisao = moverTarefa({ tarefa: { ...base(), id: 'T2' }, para: 'em_atendimento', papel: 'orientado', quem: 'diego', quando: t(2) });
  revisao = moverTarefa({ tarefa: revisao, para: 'em_revisao', papel: 'orientado', quem: 'diego', quando: t(3) });
  assert.equal(listarParaRolagem([aberta, revisao])[0].id, 'T2');
});

// ---------- sumário ----------

const bloco = (nivel, tipo = 'textual', id = `${nivel}-${Math.random()}`) => ({ id, nivel, tipo });

teste('renumeracao_reproduz_o_golden_ja_congelado_no_plano_v2', () => {
  const entrada = [1, 2, 3, 2, 1, 5].map((n) => bloco(n));
  assert.deepEqual(renumerar(entrada).map((b) => b.numero), [
    '1',
    '1.1',
    '1.1.1',
    '1.2',
    '2',
    '2.1.1.1.1',
  ]);
});

teste('renumeracao_apos_reordenar_mantem_sequencia_coerente', () => {
  const a = bloco(1, 'textual', 'a');
  const b = bloco(2, 'textual', 'b');
  const c = bloco(2, 'textual', 'c');
  const r = renumerar(mover({ blocos: [a, b, c], de: 2, para: 1, modo: 'reordenar' }));
  assert.deepEqual(r.map((x) => x.numero), ['1', '1.1', '1.2']);
});

teste('pretextual_e_postextual_nao_recebem_numero', () => {
  const entrada = [bloco(1, 'pretextual'), bloco(1), bloco(1, 'postextual')];
  assert.deepEqual(renumerar(entrada).map((b) => b.numero), [null, '1', null]);
});

teste('mover_em_modo_reordenar_desloca_sem_perder_bloco', () => {
  const a = bloco(1, 'textual', 'a');
  const b = bloco(1, 'textual', 'b');
  const c = bloco(1, 'textual', 'c');
  const r = mover({ blocos: [a, b, c], de: 2, para: 0, modo: 'reordenar' });
  assert.deepEqual(r.map((x) => x.id), ['c', 'a', 'b']);
});

teste('mover_em_modo_trocar_faz_swap_sem_perder_bloco', () => {
  const a = bloco(1, 'textual', 'a');
  const b = bloco(1, 'textual', 'b');
  const c = bloco(1, 'textual', 'c');
  const r = mover({ blocos: [a, b, c], de: 2, para: 0, modo: 'trocar' });
  assert.deepEqual(r.map((x) => x.id), ['c', 'b', 'a']);
});

teste('nenhum_bloco_desaparece_em_mil_movimentos_aleatorios', () => {
  let blocos = Array.from({ length: 12 }, (_, i) => bloco((i % 5) + 1, 'textual', `id${i}`));
  const idsIniciais = new Set(blocos.map((b) => b.id));
  for (let i = 0; i < 1000; i += 1) {
    const de = Math.floor(Math.random() * blocos.length);
    const para = Math.floor(Math.random() * blocos.length);
    const modo = Math.random() < 0.5 ? 'reordenar' : 'trocar';
    blocos = mover({ blocos, de, para, modo });
    const numerados = renumerar(blocos);
    assert.equal(numerados.length, 12);
    assert.equal(numerados.filter((b) => b.numero !== null).length, 12);
  }
  assert.deepEqual(new Set(blocos.map((b) => b.id)), idsIniciais);
});

// ---------- projeto editável ----------

const projetoBase = () => ({
  fonte: { id: 'fonte1' },
  fichas: [],
  citacoes: [],
  tags: [],
  monografia: {
    blocos: [
      { id: 'b1', numero: '1', titulo: 'Introducao', tipo: 'textual', pagina: 11, texto: 'Texto A' },
      { id: 'b2', numero: '2', titulo: 'Metodo', tipo: 'textual', pagina: 12, texto: 'Texto B' },
    ],
    figuras: [],
    tabelas: [],
    citacoes: [],
    referencias: [],
  },
});

teste('adicionar_ficha_cria_ordem_de_impressao_sem_mutar_o_projeto', () => {
  const projeto = projetoBase();
  const atualizado = adicionarFicha(projeto, { tipo: 'texto', assunto: 'Energia livre' });
  assert.equal(atualizado.fichas[0].ordemImpressao, 1);
  assert.equal(atualizado.fichas[0].assunto, 'Energia livre');
  assert.equal(projeto.fichas.length, 0);
});

teste('adicionar_secao_renumera_sumario_e_preserva_os_blocos_existentes', () => {
  const atualizado = adicionarSecao(projetoBase(), { titulo: 'Resultados', texto: 'Analise' });
  assert.deepEqual(atualizado.monografia.blocos.map((b) => b.numero), ['1', '2', '3']);
  assert.equal(atualizado.monografia.blocos.at(-1).titulo, 'Resultados');
});

teste('mover_secao_desloca_bloco_e_renumera', () => {
  const atualizado = moverSecao(projetoBase(), { id: 'b2', direcao: -1 });
  assert.deepEqual(atualizado.monografia.blocos.map((b) => b.id), ['b2', 'b1']);
  assert.deepEqual(atualizado.monografia.blocos.map((b) => b.numero), ['1', '2']);
});

teste('inserir_citacao_na_secao_coloca_texto_e_referencia', () => {
  const comCitacao = adicionarCitacao(projetoBase(), { texto: 'Crescimento do ACL', pagina: 44 });
  const atualizado = inserirCitacaoNaSecao(comCitacao, { citacaoId: comCitacao.citacoes[0].id, blocoId: 'b1' });
  assert.match(atualizado.monografia.blocos[0].texto, /Crescimento do ACL/);
  assert.equal(atualizado.monografia.citacoes[0].fonteId, 'fonte1');
  assert.equal(atualizado.monografia.referencias[0].fonteId, 'fonte1');
});

teste('figura_e_tabela_entram_vinculadas_a_secao', () => {
  let projeto = adicionarFigura(projetoBase(), { blocoId: 'b1', legenda: 'Mapa do fluxo', altText: 'Mapa' });
  projeto = adicionarTabela(projeto, { blocoId: 'b2', titulo: 'Casos' });
  assert.equal(projeto.monografia.figuras[0].blocoId, 'b1');
  assert.equal(projeto.monografia.tabelas[0].blocoId, 'b2');
});

teste('projeto_exportado_importa_com_os_mesmos_dados_editaveis', () => {
  const projeto = adicionarFicha(projetoBase(), { tipo: 'texto', assunto: 'Contratos' });
  const pacote = exportarProjeto(projeto);
  const restaurado = importarProjeto(pacote);
  assert.equal(restaurado.fichas[0].assunto, 'Contratos');
  assert.equal(restaurado.monografia.blocos[0].titulo, 'Introducao');
});

teste('atualizar_ficha_altera_assunto_sem_mudar_ordem', () => {
  let projeto = adicionarFicha(projetoBase(), { tipo: 'texto', assunto: 'Antigo' });
  projeto = atualizarFicha(projeto, { id: projeto.fichas[0].id, assunto: 'Novo' });
  assert.equal(projeto.fichas[0].assunto, 'Novo');
  assert.equal(projeto.fichas[0].ordemImpressao, 1);
});

teste('remover_ficha_retira_item_e_renumera_fila', () => {
  let projeto = adicionarFicha(projetoBase(), { tipo: 'texto', assunto: 'A' });
  projeto = adicionarFicha(projeto, { tipo: 'texto', assunto: 'B' });
  projeto = removerFicha(projeto, { id: projeto.fichas[0].id });
  assert.deepEqual(projeto.fichas.map((f) => [f.assunto, f.ordemImpressao]), [['B', 1]]);
});

teste('mover_ficha_altera_a_fila_de_impressao', () => {
  let projeto = adicionarFicha(projetoBase(), { tipo: 'texto', assunto: 'A' });
  projeto = adicionarFicha(projeto, { tipo: 'texto', assunto: 'B' });
  projeto = moverFicha(projeto, { id: projeto.fichas[1].id, direcao: -1 });
  assert.deepEqual(projeto.fichas.map((f) => [f.assunto, f.ordemImpressao]), [['B', 1], ['A', 2]]);
});

console.log(`\n${passou} testes passaram, ${falhas.length} falharam.`);
if (falhas.length > 0) process.exit(1);
