export function contarPalavras(no) {
  if (!no || no.type === 'citacaoLonga') return 0;
  const daqui = no.type === 'text' ? palavras(no.text) : 0;
  return daqui + (no.content ?? []).reduce((soma, filho) => soma + contarPalavras(filho), 0);
}

export function registrarDia(serie, entrada) {
  const semDia = serie.filter((item) => item.dia !== entrada.dia);
  return [...semDia, entrada].sort((a, b) => a.dia.localeCompare(b.dia));
}

export function progresso({ escritas, meta }) {
  return { percentual: Math.round((escritas / meta) * 100) };
}

function palavras(texto) {
  return String(texto ?? '').trim().split(/\s+/).filter(Boolean).length;
}
