export function conferir({ citacoesNoTexto, referencias }) {
  const fontesCitadas = new Set(citacoesNoTexto.map((c) => c.fonteId));
  const fontesReferenciadas = new Set(referencias.map((r) => r.fonteId));
  const orfas = citacoesNoTexto.filter((c) => !fontesReferenciadas.has(c.fonteId));
  const naoCitadas = referencias.filter((r) => !fontesCitadas.has(r.fonteId));

  return { orfas, naoCitadas, podeExportar: orfas.length === 0 };
}
