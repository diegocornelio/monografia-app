import { createHash } from 'node:crypto';

export const INTERVALO_PADRAO_MIN = 10;

export function avaliarSalvamento({ estado, ultimoHash, explicito = false }) {
  const hash = createHash('sha256').update(JSON.stringify(estado)).digest('hex');
  return { hash, gravar: explicito || hash !== ultimoHash };
}

export function normalizarIntervalo(minutos = INTERVALO_PADRAO_MIN) {
  return { minutos, ligado: minutos > 0 };
}
