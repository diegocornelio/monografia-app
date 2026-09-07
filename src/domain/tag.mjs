export function criarTag({ texto, corTexto, corFundo }) {
  if (contraste(corTexto, corFundo) < 4.5) {
    throw new Error('Contraste insuficiente entre texto e fundo');
  }
  return { texto, corTexto, corFundo };
}

export function linhaDeTags(tags) {
  return { vazia: tags.length === 0, tags };
}

function contraste(a, b) {
  const claro = Math.max(luminancia(a), luminancia(b));
  const escuro = Math.min(luminancia(a), luminancia(b));
  return (claro + 0.05) / (escuro + 0.05);
}

function luminancia(hex) {
  const [r, g, b] = hex
    .replace('#', '')
    .match(/../g)
    .map((n) => parseInt(n, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
