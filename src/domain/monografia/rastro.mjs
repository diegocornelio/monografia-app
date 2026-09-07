export function criarRastro({ perguntaPesquisa, objetivo, blocoId, evidencias = [] }) {
  return { perguntaPesquisa, objetivo, blocoId, evidencias };
}

export function conferirCobertura({ rastros }) {
  return {
    lacunas: rastros.filter((r) => !r.blocoId).map((r) => r.objetivo),
    semEvidencia: rastros.filter((r) => r.blocoId && (r.evidencias ?? []).length === 0).map((r) => r.blocoId),
  };
}

export function criarEntrada({ data, texto, decisaoMetodologica }) {
  return { data, texto, decisaoMetodologica };
}

export function decisoesMetodologicas(entradas) {
  return entradas.filter((entrada) => entrada.decisaoMetodologica);
}
