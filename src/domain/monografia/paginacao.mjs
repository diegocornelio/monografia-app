export function distribuir({ alturaPagina, itens }) {
  const paginas = [];
  let pagina = [];
  let usado = 0;

  for (const grupo of agrupar(itens)) {
    const altura = grupo.reduce((soma, item) => soma + item.altura, 0);
    if (pagina.length && usado + altura > alturaPagina) {
      paginas.push(pagina);
      pagina = [];
      usado = 0;
    }
    pagina.push(...grupo);
    usado += altura;
  }

  if (pagina.length) paginas.push(pagina);
  return { paginas };
}

export function ajustarGrupo({ disponivel, figura, legenda }) {
  const espacoFigura = disponivel - legenda.altura;
  if (espacoFigura < figura.minima) return { quebraParaProxima: true, figura, legenda };

  return {
    quebraParaProxima: false,
    figura: { ...figura, altura: Math.min(figura.altura, espacoFigura) },
    legenda: { ...legenda },
  };
}

function agrupar(itens) {
  const grupos = [];
  for (let i = 0; i < itens.length; i += 1) {
    const item = itens[i];
    if (!item.grupo) {
      grupos.push([item]);
      continue;
    }

    const grupo = [item];
    while (itens[i + 1]?.grupo === item.grupo) {
      grupo.push(itens[i + 1]);
      i += 1;
    }
    grupos.push(grupo);
  }
  return grupos;
}
