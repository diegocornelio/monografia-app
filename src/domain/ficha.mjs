export const TIPOS_FICHA = ['bibliografico', 'citacao', 'texto', 'fichao'];

export function comporFichao({ bibliografico, citacoes = [], texto }) {
  return {
    tipo: 'fichao',
    secoes: [
      { tipo: 'bibliografico', conteudo: bibliografico },
      { tipo: 'citacao', conteudo: citacoes },
      { tipo: 'texto', conteudo: texto },
    ],
  };
}

export function criarFicha({ projetoId, fonteId, tipo, assunto, ordemImpressao = 0 }) {
  if (!fonteId) throw new Error('Ficha precisa estar vinculada a uma fonte');
  if (!projetoId) throw new Error('Ficha precisa estar vinculada a um projeto');
  if (!TIPOS_FICHA.includes(tipo)) throw new Error(`Tipo de ficha desconhecido: ${tipo}`);

  return { projetoId, fonteId, tipo, assunto, ordemImpressao };
}
