// historico.mjs — versionamento de conteúdo com janela fixa de 5 versões.
// Regra do requisito: até 5 versões anteriores retornáveis; a 6ª atualização
// sobrescreve a mais antiga. Nenhuma função muta o objeto recebido.

export const MAX_VERSOES = 5;

// Cria o envelope versionado de qualquer entidade editável.
export function criarVersionado(estadoInicial) {
  return {
    atual: estadoInicial,
    versoes: [], // índice 0 = mais antiga
    removido: false,
    removidoEm: null,
  };
}

// Registra uma edição: o estado atual desce para o histórico e o novo assume.
// Quando o histórico já tem 5, a mais antiga é descartada.
export function registrarEdicao({ versionado, novoEstado, quem, quando }) {
  const entrada = {
    estado: versionado.atual,
    quem,
    quando,
  };
  const acumulado = [...versionado.versoes, entrada];
  const versoes = acumulado.slice(-MAX_VERSOES);
  return { ...versionado, atual: novoEstado, versoes };
}

// Restaura uma versão do histórico pelo índice (0 = mais antiga).
// O estado corrente vira versão, para que a restauração também seja reversível.
export function restaurar({ versionado, indice, quem, quando }) {
  const alvo = versionado.versoes[indice];
  if (alvo === undefined) {
    throw new RangeError(`versao inexistente no indice ${indice}`);
  }
  const comAtualNoHistorico = registrarEdicao({
    versionado,
    novoEstado: alvo.estado,
    quem,
    quando,
  });
  return comAtualNoHistorico;
}

// Remoção reversível: nada some do disco antes do expurgo explícito.
export function remover({ versionado, quando }) {
  return { ...versionado, removido: true, removidoEm: quando };
}

export function restaurarRemocao({ versionado }) {
  return { ...versionado, removido: false, removidoEm: null };
}

// Lista para a UI, da mais recente para a mais antiga.
export function listarVersoes(versionado) {
  return versionado.versoes
    .map((v, indice) => ({ indice, quem: v.quem, quando: v.quando }))
    .reverse();
}
