export async function buscarPorDoi({ doi, cliente }) {
  if (!/^10\.\S+\/\S+$/.test(doi)) return null;

  try {
    return { ...(await cliente.porDoi(doi)), origemMetadados: 'crossref' };
  } catch {
    return null;
  }
}
