export const LIMITES = {
  bibliografico: { total: 600 },
  citacao: { total: 1200, porCitacao: 500 },
  texto: { total: 1800 },
  fichao: { total: 3800 },
};

export function validarLimite({ tipo, texto }) {
  const limite = LIMITES[tipo];
  if (!limite) throw new Error(`Tipo desconhecido: ${tipo}`);

  const tamanho = String(texto ?? '').trimEnd().length;
  const excedente = Math.max(0, tamanho - limite.total);
  return { valido: excedente === 0, excedente };
}
