// backlog.mjs — tarefas geradas por comentário do orientador, ancoradas em bloco.
// Estados e transições, com guarda por papel. Quem valida e quem arquiva é
// somente orientador ou orientado; nenhum outro papel move a tarefa para lá.

export const ESTADOS = [
  'aberta',
  'em_atendimento',
  'em_revisao',
  'validada',
  'arquivada',
  'recusada',
];

export const PAPEIS = ['orientador', 'orientado', 'leitor'];

// origem: papel que pode disparar; destino: estado resultante.
const TRANSICOES = [
  { de: 'aberta', para: 'em_atendimento', papeis: ['orientado'] },
  { de: 'em_atendimento', para: 'em_revisao', papeis: ['orientado'] },
  { de: 'em_revisao', para: 'em_atendimento', papeis: ['orientador', 'orientado'] },
  { de: 'em_revisao', para: 'validada', papeis: ['orientador', 'orientado'] },
  { de: 'validada', para: 'arquivada', papeis: ['orientador', 'orientado'] },
  { de: 'aberta', para: 'recusada', papeis: ['orientador', 'orientado'] },
  { de: 'em_atendimento', para: 'recusada', papeis: ['orientador', 'orientado'] },
  { de: 'recusada', para: 'aberta', papeis: ['orientador'] },
];

export function criarTarefa({ id, blocoId, ancora, comentario, autor, quando }) {
  return {
    id,
    blocoId,
    ancora, // {inicio, fim} no conteúdo do bloco, para destacar o trecho
    comentario,
    autor,
    estado: 'aberta',
    motivoRecusa: null,
    criadaEm: quando,
    atualizadaEm: quando,
    ciclo: [{ estado: 'aberta', quem: autor, quando, nota: comentario }],
  };
}

export function transicoesPossiveis({ tarefa, papel }) {
  return TRANSICOES.filter((t) => t.de === tarefa.estado && t.papeis.includes(papel)).map(
    (t) => t.para,
  );
}

// Aplica a transição. Recusa exige motivo. Papel sem permissão é erro, não silêncio.
export function moverTarefa({ tarefa, para, papel, quem, quando, nota = null }) {
  const permitida = TRANSICOES.find(
    (t) => t.de === tarefa.estado && t.para === para && t.papeis.includes(papel),
  );
  if (permitida === undefined) {
    throw new Error(`transicao ${tarefa.estado} -> ${para} negada para ${papel}`);
  }
  if (para === 'recusada' && !nota) {
    throw new Error('recusa exige motivo');
  }
  return {
    ...tarefa,
    estado: para,
    motivoRecusa: para === 'recusada' ? nota : tarefa.motivoRecusa,
    atualizadaEm: quando,
    ciclo: [...tarefa.ciclo, { estado: para, quem, quando, nota }],
  };
}

// Agregação para o gráfico de realizadas contra pendentes.
export function resumoBacklog(tarefas) {
  const pendentes = tarefas.filter((t) =>
    ['aberta', 'em_atendimento', 'em_revisao'].includes(t.estado),
  ).length;
  const realizadas = tarefas.filter((t) => ['validada', 'arquivada'].includes(t.estado)).length;
  const recusadas = tarefas.filter((t) => t.estado === 'recusada').length;
  const total = tarefas.length;
  const percentual = total === 0 ? 0 : Math.round((realizadas / total) * 100);
  return { pendentes, realizadas, recusadas, total, percentual };
}

// Listagem descritiva rolável: ordena por urgência de leitura humana.
const PESO = {
  em_revisao: 0,
  aberta: 1,
  em_atendimento: 2,
  recusada: 3,
  validada: 4,
  arquivada: 5,
};

export function listarParaRolagem(tarefas) {
  return [...tarefas].sort(
    (a, b) => PESO[a.estado] - PESO[b.estado] || a.criadaEm.localeCompare(b.criadaEm),
  );
}
