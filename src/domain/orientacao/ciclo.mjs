export function versoesDaTarefa({ tarefa, historicoDoBloco, edicoesContabilizadas = historicoDoBloco.versoes.length }) {
  const versoes = historicoDoBloco.versoes.filter((v) => v.quando >= tarefa.criadaEm);
  const historicoIncompleto = edicoesContabilizadas > historicoDoBloco.versoes.length;

  return {
    versoes,
    historicoIncompleto,
    aviso: historicoIncompleto ? 'Algumas versoes nao estao mais no historico.' : null,
  };
}
