export const INTERVALO_DIAS = 3;
export const LIMITE_PAUSA_DIAS = 7;
export const LIMITACOES = ['nao e backup', 'nao protege cota de egresso'];
export const CRITERIO_APOSENTADORIA = 'remover quando houver terceiro pago com SLA';

const MS_DIA = 24 * 60 * 60 * 1000;

export function devePingar({ ultimoPing, agora = new Date().toISOString() }) {
  if (!ultimoPing) return { enviar: true };
  return { enviar: (new Date(agora) - new Date(ultimoPing)) / MS_DIA >= INTERVALO_DIAS };
}

export function montarRequisicao() {
  return { tabela: 'saude', operacao: 'upsert', linhas: 1, tocaDadosDeUsuario: false };
}

export function registrarPing({ estado = {}, em = new Date().toISOString() }) {
  return { ...estado, ultimoPing: em };
}
