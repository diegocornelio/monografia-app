export function validar(fonte) {
  const obrigatorios = {
    livro: ['titulo', 'cidade', 'editora', 'ano'],
    artigo: ['titulo', 'periodico', 'volume', 'numero', 'paginaInicial', 'paginaFinal', 'ano'],
    capitulo: ['titulo', 'tituloObra', 'cidade', 'editora', 'ano'],
    site: ['titulo', 'url', 'acessoEm'],
  }[fonte.tipoFonte] ?? [];

  const faltando = obrigatorios.filter((campo) => fonte[campo] === undefined || fonte[campo] === null || fonte[campo] === '');
  return { valido: faltando.length === 0, faltando };
}

export function formatar(fonte, { preset = 'fichario-abnt' } = {}) {
  if (preset === 'vancouver') return `${fonte.titulo}. ${fonte.ano ?? ''}.`.trim();

  if (fonte.tipoFonte === 'artigo') {
    return `${autoria(fonte)}${fonte.titulo}. ${fonte.periodico}, v. ${fonte.volume}, n. ${fonte.numero}, p. ${fonte.paginaInicial}-${fonte.paginaFinal}, ${fonte.ano}.`;
  }

  if (fonte.tipoFonte === 'capitulo') {
    const orgs = formatarAutores(fonte.organizadores ?? []);
    return `${autoria(fonte)}${fonte.titulo}. In: ${orgs} (org.). ${fonte.tituloObra}. ${fonte.cidade}: ${fonte.editora}, ${fonte.ano}. p. ${fonte.paginaInicial}-${fonte.paginaFinal}.`;
  }

  if (fonte.tipoFonte === 'site') {
    return `${fonte.titulo}. Disponível em: ${fonte.url}. Acesso em: ${formatarData(fonte.acessoEm)}.`;
  }

  return `${autoria(fonte)}${fonte.titulo}. ${edicao(fonte)}${fonte.cidade}: ${fonte.editora}, ${fonte.ano}.`;
}

function autoria(fonte) {
  const autores = fonte.autores?.length ? fonte.autores : autorUnico(fonte);
  return autores.length ? `${formatarAutores(autores)}. ` : '';
}

function autorUnico({ autorSobrenome, autorNome }) {
  return autorSobrenome ? [{ sobrenome: autorSobrenome, nome: autorNome }] : [];
}

function formatarAutores(autores) {
  if (autores.length > 3) return `${autores[0].sobrenome.toUpperCase()}, ${autores[0].nome} et al`;
  return autores.map((a) => `${a.sobrenome.toUpperCase()}, ${a.nome}`).join('; ');
}

function edicao(fonte) {
  return fonte.edicao && fonte.edicao > 1 ? `${fonte.edicao}. ed. ` : '';
}

function formatarData(valor) {
  const [ano, mes, dia] = valor.split('-').map(Number);
  const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  return `${dia} ${meses[mes - 1]} ${ano}`;
}
