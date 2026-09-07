export function registrar({ blocoId, modelo, skillId, vozId, promptHash, trechoGerado, geradoEm }) {
  if (!promptHash || promptHash.length !== 64) throw new Error('Hash do prompt obrigatorio');
  return { blocoId, modelo, skillId, vozId, promptHash, trechoGerado, geradoEm };
}

export function exigirRegistro({ geracao, trilha }) {
  const existe = trilha.some((linha) => linha.blocoId === geracao.blocoId);
  if (!existe) throw new Error('Geracao sem trilha de auditoria');
  return true;
}

export function registrarEdicaoHumana({ linha, trechoFinal, em }) {
  return { ...linha, trechoFinal, editadoEm: em };
}

export function gerarDeclaracao({ trilha }) {
  if (trilha.length === 0) return { blocosAssistidos: 0, texto: 'Não houve uso de agente de IA neste projeto.' };
  const modelos = [...new Set(trilha.map((linha) => linha.modelo))].join(', ');
  return { blocosAssistidos: trilha.length, texto: `Houve uso assistido de IA nos blocos indicados, com modelos: ${modelos}.` };
}
