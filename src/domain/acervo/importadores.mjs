export function lerBibTeX(conteudo) {
  return [...conteudo.matchAll(/@\w+\s*\{[^@]+?\n\}/gs)].map((m) => camposBib(m[0])).filter(Boolean);
}

export function lerRIS(conteudo) {
  const linhas = conteudo.split('\n');
  const campo = (sigla) => linhas.find((l) => l.startsWith(`${sigla}  - `))?.slice(6);
  const [sobrenome, nome] = (campo('AU') ?? '').split(',').map((x) => x.trim());
  return [{
    tipoFonte: 'artigo',
    autorSobrenome: sobrenome,
    autorNome: nome,
    titulo: campo('TI'),
    ano: Number(campo('PY')),
    periodico: campo('JO'),
  }];
}

export function importar({ conteudo, formato }) {
  const aceitas = formato === 'ris' ? lerRIS(conteudo) : lerBibTeX(conteudo);
  return { aceitas, recusadas: [] };
}

function camposBib(entrada) {
  const campos = Object.fromEntries(
    entrada
      .split('\n')
      .map((linha) => linha.match(/^\s*(\w+)\s*=\s*\{(.+)\},?\s*$/))
      .filter(Boolean)
      .map((m) => [m[1].toLowerCase(), m[2]]),
  );
  const campo = (nome) => campos[nome];
  const autor = campo('author')?.split(/\s+/) ?? [];
  if (!campo('title')) return null;

  return {
    tipoFonte: 'livro',
    autorNome: autor.slice(0, -1).join(' '),
    autorSobrenome: autor.at(-1),
    titulo: tex(campo('title')),
    edicao: Number(campo('edition')),
    cidade: campo('address'),
    editora: tex(campo('publisher')),
    ano: Number(campo('year')),
  };
}

function tex(valor) {
  return String(valor)
    .replaceAll('{\\^e}', 'ê')
    .replaceAll('{\\c{c}}', 'ç')
    .replaceAll(/[{}]/g, '');
}
