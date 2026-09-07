export function filtrar(acervo, filtros) {
  return acervo.filter((item) => {
    if (filtros.autor && normalizar(item.autor) !== normalizar(filtros.autor)) return false;
    if (filtros.tag && !item.tags?.includes(filtros.tag)) return false;
    if (filtros.palavraChave) {
      const alvo = normalizar(`${item.assunto ?? ''} ${item.obra ?? ''}`);
      if (!alvo.includes(normalizar(filtros.palavraChave))) return false;
    }
    return true;
  });
}

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
