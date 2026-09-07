export const PAPEIS = new Set(['autor', 'orientador', 'leitor', 'administrador']);

const CAPACIDADES = {
  autor: ['editarBloco', 'validarTarefa', 'arquivarTarefa', 'convidar', 'lerConteudo'],
  orientador: ['comentar', 'validarTarefa', 'arquivarTarefa', 'lerConteudo'],
  leitor: ['comentar', 'lerConteudo'],
  administrador: [],
};

export function pode({ papel, acao }) {
  return CAPACIDADES[papel]?.includes(acao) ?? false;
}
