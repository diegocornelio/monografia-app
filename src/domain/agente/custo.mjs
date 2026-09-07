const PADRAO = {
  ortografia: { porte: 'pequeno' },
  encadeamentoLogico: { porte: 'raciocinio' },
};

export function recomendar(tipo, { tabela = PADRAO } = {}) {
  return tabela[tipo] ?? { porte: 'medio' };
}

export function estimar({ tokensEntrada, tokensSaida, precoEntrada, precoSaida }) {
  return {
    total: (tokensEntrada / 1_000_000) * precoEntrada + (tokensSaida / 1_000_000) * precoSaida,
    momento: 'antesDaChamada',
  };
}

export function alternativaScript(tarefa) {
  return { oferece: ['renomearArquivos', 'formatarArquivos', 'converterCsv'].includes(tarefa) };
}
