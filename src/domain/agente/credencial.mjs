export function registrarChave({ estado, provedor }) {
  return { ...estado, chavesConfiguradas: [...(estado.chavesConfiguradas ?? []), provedor] };
}

export function paraExportacao(estado) {
  const { chaves, ...exportavel } = estado;
  return exportavel;
}

export function mascarar(chave) {
  const texto = String(chave ?? '');
  if (texto.length <= 4) return '••••';
  return `${texto.slice(0, 3)}…${texto.slice(-4)}`;
}
