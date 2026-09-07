export const CHAVE_CLIENTE = { tipo: 'anonima', confereAutorizacao: false };

export function validarBundle({ variaveis = {} }) {
  if (Object.keys(variaveis).some((k) => k.includes('SERVICE_ROLE'))) throw new Error('Chave de servico proibida no bundle');
}

export function conferirParidade({ regrasNaInterface = [], politicasNoBanco = [] }) {
  const semEspelhoNoBanco = regrasNaInterface.filter((r) => !politicasNoBanco.includes(r));
  return { valido: semEspelhoNoBanco.length === 0, semEspelhoNoBanco };
}

export function validarEsquema({ tabelas = [] }) {
  const semPolitica = tabelas.filter((t) => !t.politicas?.length).map((t) => t.nome);
  if (semPolitica.length) throw new Error(`Tabela sem politica: ${semPolitica.join(', ')}`);
  return true;
}
