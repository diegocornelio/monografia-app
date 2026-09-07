export const ESTADOS_LEITURA = ['identificada', 'primaria', 'secundaria'];

export function definirEstadoLeitura({ fonte, estado }) {
  if (!ESTADOS_LEITURA.includes(estado)) throw new Error(`Estado de leitura invalido: ${estado}`);
  return { ...fonte, estadoLeitura: estado };
}

export function podeSustentarCitacao({ estadoLeitura, tipoCitacao }) {
  return { pode: !(estadoLeitura === 'identificada' && tipoCitacao === 'direta') };
}

export async function conferirLink({ url, cliente }) {
  const status = await cliente.status(url);
  return { vivo: status >= 200 && status < 400, sugereArquivar: status >= 400 };
}

export function registrarArquivamento({ fonte, urlArquivada }) {
  return { ...fonte, urlArquivada };
}

export async function conferirRetratacao({ fonte, cliente }) {
  try {
    const r = await cliente.retratacao(fonte.doi);
    return { ...r, bloqueiaExport: r.retratada === true };
  } catch {
    return { retratada: null, estado: 'indeterminado', bloqueiaExport: false };
  }
}
