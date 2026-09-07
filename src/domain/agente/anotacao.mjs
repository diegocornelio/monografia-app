export function processarResposta({ blocoId, resposta }) {
  return {
    aplicado: false,
    anotacoes: (resposta.achados ?? []).map((achado, indice) => ({
      id: achado.id ?? `anotacao-${indice + 1}`,
      blocoId,
      ...achado,
    })),
  };
}

export function aplicar({ anotacao, confirmadoPor }) {
  if (!confirmadoPor) throw new Error('Confirmacao humana obrigatoria');
  return { texto: anotacao.sugestao, anterior: anotacao.original, confirmadoPor };
}

export function paraMapaLogico(anotacoes) {
  return anotacoes
    .filter((anotacao) => anotacao.tipo === 'saltoLogico')
    .map((anotacao) => ({ de: anotacao.deNoId, para: anotacao.paraNoId, tipo: 'salto' }));
}
