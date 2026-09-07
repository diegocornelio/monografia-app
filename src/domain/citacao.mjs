export function criarCitacao({ fonteId, texto, pagina, tipo = 'direta' }) {
  if (pagina === undefined || pagina === null || pagina === '') {
    throw new Error('Citação precisa informar página');
  }

  return {
    fonteId,
    textoLimpo: limparAspas(texto),
    pagina,
    tipo,
  };
}

export function apresentar(citacao, { linhas }) {
  if (linhas > 3 && citacao.tipo !== 'indireta') {
    return {
      texto: citacao.textoLimpo,
      pagina: citacao.pagina,
      formato: 'recuo',
      recuoCm: 4,
      corpo: 10,
      comAspas: false,
    };
  }

  const pagina = `(p. ${citacao.pagina})`;
  if (citacao.tipo === 'indireta') return `${citacao.textoLimpo} ${pagina}`;
  return `"${citacao.textoLimpo}" ${pagina}`;
}

function limparAspas(texto) {
  return String(texto ?? '').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
}
