// sumario.mjs — numeração automática e movimento de blocos.
// Profundidade máxima 5. Pré-textuais e pós-textuais não recebem número.
// Salto de nível é normalizado para o nível imediatamente inferior permitido.

export const PROFUNDIDADE_MAX = 5;

export function renumerar(blocos) {
  const contadores = [0, 0, 0, 0, 0];
  return blocos.map((bloco) => {
    if (bloco.tipo !== 'textual') return { ...bloco, numero: null };
    const nivel = Math.min(Math.max(bloco.nivel, 1), PROFUNDIDADE_MAX);
    contadores[nivel - 1] += 1;
    for (let i = nivel; i < PROFUNDIDADE_MAX; i += 1) contadores[i] = 0;
    // o nivel declarado pelo usuario e preservado; ancestral ausente vira 1
    for (let i = 0; i < nivel - 1; i += 1) if (contadores[i] === 0) contadores[i] = 1;
    return { ...bloco, nivel, numero: contadores.slice(0, nivel).join('.') };
  });
}

// modo 'reordenar' desloca o bloco para a posição destino; 'trocar' faz swap.
export function mover({ blocos, de, para, modo = 'reordenar' }) {
  if (de === para) return [...blocos];
  const copia = [...blocos];
  if (modo === 'trocar') {
    [copia[de], copia[para]] = [copia[para], copia[de]];
    return copia;
  }
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
}
