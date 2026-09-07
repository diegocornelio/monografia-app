import { createHash } from 'node:crypto';

export function montarManifesto({ recursos }) {
  return {
    recursos: recursos.map((r) => ({ caminho: r.caminho, hash: hash(r.bytes) })),
  };
}

export function conferirManifesto({ manifesto, recursos }) {
  const porCaminho = new Map(recursos.map((r) => [r.caminho, r]));
  const ausentes = [];
  const corrompidos = [];

  for (const esperado of manifesto.recursos) {
    const recurso = porCaminho.get(esperado.caminho);
    if (!recurso) {
      ausentes.push(esperado.caminho);
    } else if (hash(recurso.bytes) !== esperado.hash) {
      corrompidos.push(esperado.caminho);
    }
  }

  return { valido: ausentes.length === 0 && corrompidos.length === 0, ausentes, corrompidos };
}

export function nomeDoPacote({ projeto, versao, em }) {
  return `${projeto}_v${versao}_${em.slice(0, 16).replace(':', '-')}.zip`;
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
