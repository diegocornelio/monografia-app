export function criarComentario({ blocoId, texto, inicio, fim, conteudoBloco, geraTarefa = true }) {
  const inicioZero = inicio - 2;
  return {
    blocoId,
    texto,
    geraTarefa,
    flutuante: false,
    ancora: {
      inicio,
      fim,
      transcricao: conteudoBloco.slice(inicioZero, fim - 2),
    },
  };
}

export function reancorar({ comentario, conteudoBloco }) {
  const inicio = conteudoBloco.indexOf(comentario.ancora.transcricao);
  if (inicio === -1) {
    return {
      ...comentario,
      flutuante: true,
      posicaoDeExibicao: 'topoDoBloco',
      aviso: 'O texto original mudou; comentario exibido no topo do bloco.',
    };
  }

  return {
    ...comentario,
    flutuante: false,
    ancora: {
      ...comentario.ancora,
      inicio,
      fim: inicio + comentario.ancora.transcricao.length,
    },
  };
}

export function entraNoBacklog(comentario) {
  return comentario.geraTarefa;
}
