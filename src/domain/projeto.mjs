import { apresentar, criarCitacao } from './citacao.mjs';
import { criarFicha } from './ficha.mjs';
import { mover, renumerar } from './sumario.mjs';

export function adicionarFicha(projeto, { tipo, assunto }) {
  const ficha = {
    id: uid('ficha'),
    ...criarFicha({
      projetoId: projeto.id ?? 'p1',
      fonteId: projeto.fonte.id,
      tipo,
      assunto,
      ordemImpressao: projeto.fichas.length + 1,
    }),
  };
  return { ...projeto, fichas: [...projeto.fichas, ficha] };
}

export function atualizarFicha(projeto, { id, assunto, tipo }) {
  const fichas = projeto.fichas.map((ficha) =>
    ficha.id === id
      ? {
          ...ficha,
          assunto: assunto ?? ficha.assunto,
          tipo: tipo ?? ficha.tipo,
        }
      : ficha,
  );
  return { ...projeto, fichas };
}

export function removerFicha(projeto, { id }) {
  return { ...projeto, fichas: renumerarFichas(projeto.fichas.filter((ficha) => ficha.id !== id)) };
}

export function moverFicha(projeto, { id, direcao }) {
  const de = projeto.fichas.findIndex((ficha) => ficha.id === id);
  const para = de + direcao;
  if (de < 0 || para < 0 || para >= projeto.fichas.length) return projeto;
  const fichas = [...projeto.fichas];
  const [ficha] = fichas.splice(de, 1);
  fichas.splice(para, 0, ficha);
  return { ...projeto, fichas: renumerarFichas(fichas) };
}

export function adicionarCitacao(projeto, { texto, pagina, tipo = 'direta' }) {
  const citacao = {
    id: uid('cit'),
    ...criarCitacao({ fonteId: projeto.fonte.id, texto, pagina, tipo }),
  };
  return { ...projeto, citacoes: [...projeto.citacoes, citacao] };
}

export function atualizarCitacao(projeto, { id, texto, pagina, tipo }) {
  const citacoes = projeto.citacoes.map((citacao) =>
    citacao.id === id
      ? {
          ...citacao,
          textoLimpo: texto === undefined ? citacao.textoLimpo : limparAspas(texto),
          pagina: pagina ?? citacao.pagina,
          tipo: tipo ?? citacao.tipo,
        }
      : citacao,
  );
  return { ...projeto, citacoes };
}

export function removerCitacao(projeto, { id }) {
  const citacoes = projeto.citacoes.filter((citacao) => citacao.id !== id);
  return {
    ...projeto,
    citacoes,
    monografia: {
      ...projeto.monografia,
      citacoes: projeto.monografia.citacoes.filter((citacao) => citacao.id !== id),
    },
  };
}

export function adicionarSecao(projeto, { titulo, texto = '', nivel = 1 }) {
  const blocos = renumerar([
    ...normalizarBlocos(projeto.monografia.blocos),
    {
      id: uid('b'),
      nivel,
      numero: null,
      titulo,
      tipo: 'textual',
      pagina: 10 + projeto.monografia.blocos.length + 1,
      texto,
    },
  ]);
  return comMonografia(projeto, { blocos });
}

export function removerSecao(projeto, { id }) {
  const blocos = renumerar(normalizarBlocos(projeto.monografia.blocos).filter((bloco) => bloco.id !== id));
  const figuras = projeto.monografia.figuras.filter((figura) => figura.blocoId !== id);
  const tabelas = projeto.monografia.tabelas.filter((tabela) => tabela.blocoId !== id);
  return comMonografia(projeto, { blocos, figuras, tabelas });
}

export function moverSecao(projeto, { id, direcao }) {
  const de = projeto.monografia.blocos.findIndex((bloco) => bloco.id === id);
  const para = de + direcao;
  if (de < 0 || para < 0 || para >= projeto.monografia.blocos.length) return projeto;
  const blocos = renumerar(mover({ blocos: normalizarBlocos(projeto.monografia.blocos), de, para }));
  return comMonografia(projeto, { blocos });
}

export function atualizarTextoSecao(projeto, { id, texto }) {
  const blocos = projeto.monografia.blocos.map((bloco) => (bloco.id === id ? { ...bloco, texto } : bloco));
  return comMonografia(projeto, { blocos });
}

export function inserirCitacaoNaSecao(projeto, { citacaoId, blocoId }) {
  const citacao = projeto.citacoes.find((item) => item.id === citacaoId);
  if (!citacao) return projeto;
  const trecho = apresentar(citacao, { linhas: 1 });
  const textoCitacao = typeof trecho === 'string' ? trecho : trecho.texto;
  const blocos = projeto.monografia.blocos.map((bloco) =>
    bloco.id === blocoId ? { ...bloco, texto: [bloco.texto.trim(), textoCitacao].filter(Boolean).join('\n\n') } : bloco,
  );
  const citacoes = unicaPorId([
    ...projeto.monografia.citacoes,
    { id: citacao.id, fonteId: citacao.fonteId, linhas: 1, pagina: citacao.pagina },
  ]);
  const referencias = unicaPorFonte([...projeto.monografia.referencias, { fonteId: citacao.fonteId }]);
  return comMonografia(projeto, { blocos, citacoes, referencias });
}

export function adicionarFigura(projeto, { blocoId, legenda, altText }) {
  const figuras = [
    ...projeto.monografia.figuras,
    {
      id: uid('fig'),
      blocoId,
      legenda,
      fonte: 'autor',
      altText,
      pagina: paginaDoBloco(projeto, blocoId),
    },
  ];
  return comMonografia(projeto, { figuras });
}

export function adicionarTabela(projeto, { blocoId, titulo }) {
  const tabelas = [
    ...projeto.monografia.tabelas,
    {
      id: uid('tab'),
      blocoId,
      titulo,
      fonte: 'autor',
      pagina: paginaDoBloco(projeto, blocoId),
    },
  ];
  return comMonografia(projeto, { tabelas });
}

export function exportarProjeto(projeto) {
  return JSON.stringify(projeto, null, 2);
}

export function importarProjeto(pacote) {
  return JSON.parse(pacote);
}

function comMonografia(projeto, mudancas) {
  return { ...projeto, monografia: { ...projeto.monografia, ...mudancas } };
}

function normalizarBlocos(blocos) {
  return blocos.map((bloco) => ({ nivel: 1, ...bloco }));
}

function paginaDoBloco(projeto, id) {
  return projeto.monografia.blocos.find((bloco) => bloco.id === id)?.pagina ?? 1;
}

function unicaPorId(itens) {
  return [...new Map(itens.map((item) => [item.id, item])).values()];
}

function unicaPorFonte(itens) {
  return [...new Map(itens.map((item) => [item.fonteId, item])).values()];
}

function renumerarFichas(fichas) {
  return fichas.map((ficha, indice) => ({ ...ficha, ordemImpressao: indice + 1 }));
}

function uid(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function limparAspas(texto) {
  return String(texto ?? '').trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
}
