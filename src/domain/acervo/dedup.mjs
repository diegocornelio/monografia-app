export function avaliar(acervo, fonte) {
  const doi = fonte.doi?.toLowerCase();
  if (doi) {
    const existente = acervo.find((f) => f.doi?.toLowerCase() === doi);
    if (existente) return duplicata('doi', existente);
  }

  const titulo = normalizar(fonte.titulo);
  const existente = acervo.find((f) => normalizar(f.titulo) === titulo && f.ano === fonte.ano);
  return existente ? duplicata('tituloAno', existente) : { duplicada: false };
}

function duplicata(criterio, existente) {
  return { duplicada: true, criterio, existente, acaoAutomatica: false, sugestao: 'mesclar' };
}

function normalizar(valor) {
  return String(valor ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
