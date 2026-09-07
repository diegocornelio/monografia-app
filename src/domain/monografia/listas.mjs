export function gerarSumario({ blocos }) {
  return blocos
    .filter((b) => b.tipo === 'textual')
    .map((b) => ({ numero: b.numero, titulo: b.titulo, pagina: b.pagina, nivel: b.numero.split('.').length }));
}

export function gerarListaFiguras(projeto) {
  return ordenarPorBloco(projeto.figuras, projeto).map((figura, i) => ({
    ...figura,
    rotulo: `Figura ${i + 1} - ${figura.legenda}`,
  }));
}

export function gerarListaTabelas(projeto) {
  return ordenarPorBloco(projeto.tabelas, projeto).map((tabela, i) => ({
    ...tabela,
    rotulo: `Tabela ${i + 1} - ${tabela.titulo}`,
  }));
}

function ordenarPorBloco(itens, projeto) {
  const posicao = new Map(projeto.blocos.map((b, i) => [b.id, i]));
  return [...itens].sort((a, b) => posicao.get(a.blocoId) - posicao.get(b.blocoId));
}
