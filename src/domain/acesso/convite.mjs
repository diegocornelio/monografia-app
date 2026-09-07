const PAPEIS_CONVIDADOS = new Set(['orientador', 'leitor']);

export function criarConvite({ projetoId, email, papel, em = new Date().toISOString() }) {
  if (!PAPEIS_CONVIDADOS.has(papel)) throw new Error('Papel de convite invalido');
  const criado = new Date(em);
  const expira = new Date(criado);
  expira.setDate(expira.getDate() + 14);
  return { id: `${projetoId}:${email}:${papel}`, projetoId, email, papel, criadoEm: criado.toISOString(), expiraEm: expira.toISOString(), revogadoEm: null };
}

export function validarConvite({ convite, agora = new Date().toISOString() }) {
  return { valido: !convite.revogadoEm && new Date(convite.expiraEm) > new Date(agora) };
}

export function revogar({ convite, sessoesAtivas = [], em = new Date().toISOString() }) {
  return {
    convite: { ...convite, revogadoEm: em },
    sessoesEncerradas: sessoesAtivas.filter((s) => s.conviteId === convite.id).map((s) => s.id),
  };
}

export function registrarAcesso({ historico = [], conviteId, em = new Date().toISOString() }) {
  return [...historico, { conviteId, em }];
}

export function aceitaMais({ novo }) {
  return PAPEIS_CONVIDADOS.has(novo);
}
