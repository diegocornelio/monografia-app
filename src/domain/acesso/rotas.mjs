const ROTAS_ORIENTADOR = [
  '/orientacao/:projetoId/documentos',
  '/orientacao/:projetoId/progresso',
  '/orientacao/:projetoId/referencias',
  '/orientacao/:projetoId/tarefas',
];

const ROTAS_AGENTE = ['/agente', '/agente/chaves', '/agente/prompts', '/agente/custos', '/agente/auditoria'];
const ROTAS_PUBLICAS = ['/entrar', '/cadastrar', '/recuperar-senha', '/nova-senha', '/auth/callback'];
const ORIGEM_PUBLICA_PADRAO = 'https://fichario-9ob.pages.dev';

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

export function destinoCallbackAuth({ origem, origemPublica = ORIGEM_PUBLICA_PADRAO }) {
  return `${origemAuth({ origem, origemPublica })}/auth/callback`;
}

export function destinoNovaSenha({ origem, origemPublica = ORIGEM_PUBLICA_PADRAO }) {
  return `${origemAuth({ origem, origemPublica })}/nova-senha`;
}

export function retornoAuthDaUrl({ rota, busca = '', hash = '' }) {
  const parametrosBusca = new URLSearchParams(String(busca).replace(/^\?/, ''));
  const parametrosHash = new URLSearchParams(String(hash).replace(/^#/, ''));
  const erro = parametrosBusca.get('error_description') ?? parametrosHash.get('error_description') ?? parametrosBusca.get('error') ?? parametrosHash.get('error');
  if (erro) return { tipo: 'erro', mensagem: erro, destino: '/entrar' };

  const codigo = parametrosBusca.get('code');
  if (rota === '/auth/callback' && codigo) return { tipo: 'codigo', codigo, destino: '/app' };

  const accessToken = parametrosHash.get('access_token');
  const refreshToken = parametrosHash.get('refresh_token');
  if (accessToken && refreshToken) {
    return { tipo: 'sessaoHash', accessToken, refreshToken, destino: rota === '/nova-senha' ? '/nova-senha' : '/app' };
  }

  return null;
}

export function protegerRota({ rota, usuario }) {
  if (ROTAS_PUBLICAS.includes(rota)) return { permitido: true, status: 200 };
  if (!usuario?.id) {
    return { permitido: false, status: 302, destino: '/entrar', motivo: 'sessaoAusente' };
  }
  return { permitido: true, status: 200 };
}

function semBarraFinal(valor) {
  return String(valor).replace(/\/$/, '');
}

function origemAuth({ origem, origemPublica }) {
  const normalizada = semBarraFinal(origem);
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizada)) {
    return semBarraFinal(origemPublica || ORIGEM_PUBLICA_PADRAO);
  }
  return normalizada;
}
