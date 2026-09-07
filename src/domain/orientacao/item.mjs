import { transicoesPossiveis } from '../backlog.mjs';

export function montarItem({ tarefa, bloco, agora, papel }) {
  return {
    id: tarefa.id,
    capitulo: `${bloco.numero} ${bloco.titulo}`,
    trecho: tarefa.ancora?.transcricao,
    comentario: tarefa.comentario,
    autor: tarefa.autor,
    estado: tarefa.estado,
    idadeNoEstadoDias: diasEntre(tarefa.atualizadaEm ?? tarefa.criadaEm, agora),
    idasEVoltas: Math.max(0, tarefa.ciclo.filter((c) => c.estado === 'em_revisao').length - 1),
    acoes: acoesDaListagem({ tarefa, papel }),
  };
}

function acoesDaListagem({ tarefa, papel }) {
  if (papel === 'leitor') return [];
  const acoes = transicoesPossiveis({ tarefa, papel });
  if (tarefa.estado === 'em_revisao' && ['orientador', 'orientado'].includes(papel)) return [...acoes, 'recusada'];
  return acoes;
}

function diasEntre(inicio, fim) {
  return Math.floor((Date.parse(fim) - Date.parse(inicio)) / 86_400_000);
}
