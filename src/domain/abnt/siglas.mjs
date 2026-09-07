export function extrairSiglas(blocos) {
  const mapa = new Map();

  for (const bloco of blocos) {
    for (const achado of bloco.texto.matchAll(/([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+(?:\s+de|\s+da|\s+do|\s+dos|\s+das|\s+e|\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÁÉÍÓÚÂÊÔÃÕÇáéíóúâêôãõç]+)+)\s+\(([A-Z]{2,})\)/g)) {
      mapa.set(achado[2], {
        sigla: achado[2],
        significado: achado[1],
        primeiraOcorrenciaBlocoId: bloco.id,
        pendente: false,
      });
    }

    for (const achado of bloco.texto.matchAll(/\b[A-Z]{2,}\b/g)) {
      if (!mapa.has(achado[0])) {
        mapa.set(achado[0], {
          sigla: achado[0],
          significado: null,
          primeiraOcorrenciaBlocoId: bloco.id,
          pendente: true,
        });
      }
    }
  }

  return [...mapa.values()].sort((a, b) => a.sigla.localeCompare(b.sigla));
}
