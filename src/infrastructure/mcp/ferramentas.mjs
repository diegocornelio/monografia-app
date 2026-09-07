import { adicionarFicha, inserirCitacaoNaSecao } from '../../domain/projeto.mjs';

export const FERRAMENTAS = {
  listar_fichas: leitura((_, estado) => estado.fichas ?? []),
  buscar_fichas: leitura(({ termo }, estado) => (estado.fichas ?? []).filter((f) => f.assunto?.includes(termo))),
  criar_ficha: escrita((entrada, estado) => adicionarFicha(estado, entrada)),
  listar_citacoes: leitura((_, estado) => estado.citacoes ?? []),
  inserir_citacao_no_bloco: escrita((entrada, estado) => inserirCitacaoNaSecao(estado, entrada)),
  ler_bloco: leitura(({ blocoId }, estado) => (estado.blocos ?? estado.monografia?.blocos ?? []).find((b) => b.id === blocoId)),
  propor_edicao_bloco: leitura(async ({ blocoId, novoTexto }, estado) => {
    const bloco = (estado.blocos ?? estado.monografia?.blocos ?? []).find((b) => b.id === blocoId);
    return { aplicado: false, diff: `- ${bloco?.texto ?? ''}\n+ ${novoTexto}` };
  }),
  exportar_projeto: leitura((_, estado) => JSON.stringify(estado, null, 2)),
};

function leitura(executar) {
  return { escreve: false, exigeConfirmacao: false, executar };
}

function escrita(executar) {
  return {
    escreve: true,
    exigeConfirmacao: true,
    executar: async (entrada, estado) => {
      if (!entrada || Object.keys(entrada).length === 0) throw new Error('Entrada fora do esquema');
      return executar(entrada, estado);
    },
  };
}
