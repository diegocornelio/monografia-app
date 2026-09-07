export function migrar(projeto) {
  if (projeto.versao === '3.0') return projeto;
  if (!['1.0', '2.0'].includes(projeto.versao)) {
    throw new Error(`Versao desconhecida: ${projeto.versao}`);
  }

  return {
    ...projeto,
    versao: '3.0',
    comentarios: projeto.comentarios ?? [],
    tarefas: projeto.tarefas ?? [],
    versoes: projeto.versoes ?? [],
    auditoria: projeto.auditoria ?? [],
  };
}
