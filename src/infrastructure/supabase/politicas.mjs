export const TABELAS_DE_CONTEUDO = ['projetos', 'blocos', 'fontes', 'fichas', 'citacoes', 'tarefas', 'comentarios'];

export function temPolitica(tabela) {
  return TABELAS_DE_CONTEUDO.includes(tabela);
}
