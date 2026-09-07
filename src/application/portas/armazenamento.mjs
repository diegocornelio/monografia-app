export const CONTRATO_ARMAZENAMENTO = {
  criarPasta: true,
  enviar: true,
  baixar: true,
  listar: true,
  apagar: true,
  linkDeVisualizacao: true,
};

export function estadoDoCofre({ token }) {
  if (!token || token.revogado) return { modo: 'local', avisoPersistente: true, perdaDeDados: false };
  return { modo: 'drive', avisoPersistente: false, perdaDeDados: false };
}

export function resolverConflito({ local, remoto }) {
  return { exigeDecisao: local.hash !== remoto.hash, opcoes: [local, remoto], sobrescritaSilenciosa: false };
}

export function reescreverVersao() {
  throw new Error('Versao gravada no cofre e imutavel');
}
