export function validarProps({ afirmacao, destaque, anotacoes }) {
  if (!afirmacao || destaque === undefined || !Array.isArray(anotacoes)) throw new Error('Grafico narrado exige afirmacao, destaque e anotacoes');
  if (/^status d[aeo]s? /i.test(afirmacao)) throw new Error('Titulo deve afirmar algo, nao apenas nomear o assunto');
}

export function montar(props) {
  validarProps(props);
  return {
    ...props,
    alternativaTextual: props.afirmacao,
    estadoVazio: props.dados.length === 0 ? 'Ainda nao ha dados para este grafico.' : null,
  };
}
