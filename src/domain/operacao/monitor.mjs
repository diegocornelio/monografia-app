const MS_DIA = 24 * 60 * 60 * 1000;

export function avaliar({ cotas = {}, ultimoPing, agora = new Date().toISOString() }) {
  const alertas = [];
  for (const [cota, v] of Object.entries(cotas)) {
    if (v.teto && v.uso / v.teto >= 0.8) alertas.push({ tipo: 'cota', cota, consequencia: 'cota estourada interrompe o servico' });
  }
  if (!ultimoPing || (new Date(agora) - new Date(ultimoPing)) / MS_DIA > 4) {
    alertas.push({ tipo: 'pingParado', consequencia: 'projeto pode pausar por inatividade' });
  }
  return { alertas };
}

export function podeVer({ papel }) {
  return papel === 'administrador';
}
