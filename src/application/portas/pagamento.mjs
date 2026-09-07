export const CONTRATO_PAGAMENTO = {
  assinar: null,
  cancelar: null,
  consultarAssinatura: null,
  reativar: null,
  tratarWebhook: null,
};

export function tratarWebhook({ eventos = [], evento }) {
  if (eventos.some((e) => e.id === evento.id)) return { aplicado: false, eventos };
  return { aplicado: true, eventos: [...eventos, evento] };
}

export function aplicarInadimplencia({ projetos }) {
  return { plano: 'gratis', projetosPreservados: projetos, exportacaoLiberada: true };
}

export function excluirConta({ usuarioId }) {
  return { usuarioId, tokenRevogado: true, indiceApagado: true, arquivosDoUsuarioNoDrive: 'preservados' };
}
