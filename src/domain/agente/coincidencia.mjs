export const TAMANHO_SHINGLE = 8;

export function conferir({ blocos, trechosDeFonte }) {
  const achados = [];
  for (const fonte of trechosDeFonte) {
    const alvo = normalizar(fonte.texto);
    if (palavras(alvo).length < TAMANHO_SHINGLE) continue;
    for (const bloco of blocos) {
      const texto = normalizar(bloco.texto);
      const citado = (bloco.citacoesVinculadas ?? []).includes(fonte.citacaoId);
      const entreAspas = bloco.texto.includes(`"${fonte.texto}"`);
      if (texto.includes(alvo) && !(citado && entreAspas)) {
        achados.push({ blocoId: bloco.id, fonteId: fonte.fonteId, bloqueiaExport: true });
      }
    }
  }
  return { achados, escopoDeclarado: 'Verificacao limitada as fontes do proprio projeto.' };
}

function normalizar(texto) {
  return String(texto ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function palavras(texto) {
  return texto.split(/\s+/).filter(Boolean);
}
