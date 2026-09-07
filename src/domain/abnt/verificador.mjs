const PRETEXTUAIS_OBRIGATORIOS = ['capa', 'folhaRosto', 'folhaAprovacao', 'resumo', 'abstract', 'sumario'];

export function verificar(projeto) {
  const violacoes = [];
  const v = (regra, id, bloqueia = true, extra = {}) =>
    violacoes.push({ regra, bloqueia, ancora: { id }, ...extra });

  for (const figura of projeto.figuras ?? []) {
    if (!figura.altText) v('figuraSemAltText', figura.id);
    if (!figura.legenda) v('figuraSemLegenda', figura.id);
    if (!figura.fonte) v('figuraSemFonte', figura.id);
  }

  for (const tabela of projeto.tabelas ?? []) {
    if (!tabela.titulo) v('tabelaSemTitulo', tabela.id);
    if (!tabela.fonte) v('tabelaSemFonte', tabela.id);
  }

  for (const citacao of projeto.citacoes ?? []) {
    if (citacao.linhas > 3 && (citacao.recuoCm !== 4 || citacao.corpo !== 10)) v('citacaoLongaSemRecuo', citacao.id);
    if (citacao.pagina === null || citacao.pagina === undefined) v('citacaoSemPagina', citacao.id);
  }

  const faltando = PRETEXTUAIS_OBRIGATORIOS.filter((item) => !projeto.pretextuais?.includes(item));
  if (faltando.length) v('pretextualObrigatorioAusente', 'pretextuais', true, { faltando });

  if (projeto.preset?.margens?.join(',') !== '3,2,2,3') v('margemDivergente', 'preset', false);

  return { violacoes, podeExportar: violacoes.every((item) => !item.bloqueia) };
}
