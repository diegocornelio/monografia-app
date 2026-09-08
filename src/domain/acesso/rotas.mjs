const ROTAS_ORIENTADOR = [
  '/orientacao/:projetoId/documentos',
  '/orientacao/:projetoId/progresso',
  '/orientacao/:projetoId/referencias',
  '/orientacao/:projetoId/tarefas',
];

const ROTAS_AGENTE = ['/agente', '/agente/chaves', '/agente/prompts', '/agente/custos', '/agente/auditoria'];
const ROTAS_PUBLICAS = ['/entrar', '/cadastrar', '/auth/callback'];

export function resolver({ papel, rota, publicada = false }) {
  if (ROTAS_AGENTE.includes(rota) && papel !== 'autor') {
    return { permitido: false, status: 403, motivo: 'papelSemCapacidade', ocultacaoVisual: false };
  }
  if (rota === '/orientacao/:projetoId/declaracao-ia') return { permitido: Boolean(publicada), status: publicada ? 200 : 404 };
  return { permitido: true, status: 200 };
}

export function rotasDoPapel(papel) {
  return papel === 'orientador' ? ROTAS_ORIENTADOR : [];
}

export function consultaDaView({ papel, projetoId }) {
  return {
    papel,
    projetoId,
    tabelas: papel === 'orientador' ? ['documentos', 'referencias', 'progresso', 'tarefas'] : [],
  };
}

export function protegerRota({ rota, usuario }) {
  if (ROTAS_PUBLICAS.includes(rota)) return { permitido: true, status: 200 };
  if (!usuario?.id) {
    return { permitido: false, status: 302, destino: '/entrar', motivo: 'sessaoAusente' };
  }
  return { permitido: true, status: 200 };
}
