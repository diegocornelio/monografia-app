import './styles.css';
import { conferir } from './domain/abnt/coerencia.mjs';
import { formatar } from './domain/abnt/referencia.mjs';
import { extrairSiglas } from './domain/abnt/siglas.mjs';
import { verificar } from './domain/abnt/verificador.mjs';
import { avaliar } from './domain/acervo/dedup.mjs';
import { lerBibTeX } from './domain/acervo/importadores.mjs';
import { filtrar } from './domain/busca.mjs';
import { criarCitacao, apresentar } from './domain/citacao.mjs';
import { criarFicha } from './domain/ficha.mjs';
import { validarLimite } from './domain/limites.mjs';
import { gerarListaFiguras, gerarListaTabelas, gerarSumario } from './domain/monografia/listas.mjs';
import { contarPalavras, progresso } from './domain/monografia/metas.mjs';
import { criarRastro } from './domain/monografia/rastro.mjs';
import { montarItem } from './domain/orientacao/item.mjs';
import { criarTarefa, moverTarefa, resumoBacklog } from './domain/backlog.mjs';
import { criarTag, linhaDeTags } from './domain/tag.mjs';
import { montar as montarGrafico } from './ui/graficos/GraficoNarrado.mjs';

const estado = {
  fonte: {
    id: 'f01',
    tipoFonte: 'livro',
    autorSobrenome: 'ECO',
    autorNome: 'Umberto',
    titulo: 'Como se faz uma tese em Ciencias Humanas',
    edicao: 6,
    cidade: 'Lisboa',
    editora: 'Editorial Presenca',
    ano: 1995,
  },
  fichas: [
    criarFicha({ projetoId: 'p1', fonteId: 'f01', tipo: 'texto', assunto: 'Metodo cientifico', ordemImpressao: 1 }),
  ],
  citacoes: [criarCitacao({ fonteId: 'f01', texto: '"Trecho selecionado da obra"', pagina: 43 })],
  tags: [criarTag({ texto: 'metodologia', corTexto: '#2B2B2B', corFundo: '#EFE6DA' })],
  monografia: {
    blocos: [
      { id: 'b1', numero: '1', titulo: 'Introducao', tipo: 'textual', pagina: 11, texto: 'A Camara de Comercializacao de Energia Eletrica (CCEE) publica dados.' },
      { id: 'b2', numero: '1.1', titulo: 'Problema', tipo: 'textual', pagina: 13, texto: 'O ambiente ACL cresce.' },
    ],
    figuras: [{ id: 'fig1', blocoId: 'b1', legenda: 'Fluxo de pesquisa', fonte: 'autor', altText: 'Fluxo de pesquisa', pagina: 12 }],
    tabelas: [{ id: 'tab1', blocoId: 'b2', titulo: 'Casos analisados', fonte: 'autor', pagina: 14 }],
    pretextuais: ['capa', 'folhaRosto', 'folhaAprovacao', 'resumo', 'abstract', 'sumario'],
    preset: { margens: [3, 2, 2, 3], corpo: 12, entrelinha: 1.5 },
    citacoes: [{ id: 'c1', fonteId: 'f01', linhas: 1, pagina: 43 }],
    referencias: [{ fonteId: 'f01' }],
  },
};

function desenhar(filtro = '') {
  const acervo = estado.fichas.map((ficha) => ({
    ...ficha,
    autor: estado.fonte.autorSobrenome,
    obra: estado.fonte.titulo,
    tags: estado.tags.map((t) => t.texto),
  }));
  const fichas = filtrar(acervo, filtro ? { palavraChave: filtro } : {});
  const importadas = lerBibTeX('@book{eco1995,\n  author = {Umberto Eco},\n  title = {Como se faz uma tese em Ci{\\^e}ncias Humanas},\n  year = {1995}\n}');
  const duplicata = avaliar([estado.fonte], { doi: '10.1/abc', titulo: estado.fonte.titulo, ano: 1995 });
  const sumario = gerarSumario(estado.monografia);
  const verificacao = verificar(estado.monografia);
  const siglas = extrairSiglas(estado.monografia.blocos);
  const coerencia = conferir({ citacoesNoTexto: [{ id: 'c1', fonteId: 'f01' }], referencias: estado.monografia.referencias });
  const palavras = contarPalavras({ type: 'doc', content: estado.monografia.blocos.map((b) => ({ type: 'paragraph', content: [{ type: 'text', text: b.texto }] })) });
  const meta = progresso({ escritas: palavras, meta: 1000 });
  const tarefa = moverTarefa({
    tarefa: moverTarefa({
      tarefa: criarTarefa({ id: 'T1', blocoId: 'b2', ancora: { transcricao: 'O ambiente ACL cresce.' }, comentario: 'delimitar melhor o problema', autor: 'diego', quando: '2026-09-01T00:00:00Z' }),
      para: 'em_atendimento',
      papel: 'orientado',
      quem: 'diego',
      quando: '2026-09-04T00:00:00Z',
    }),
    para: 'em_revisao',
    papel: 'orientado',
    quem: 'diego',
    quando: '2026-09-05T00:00:00Z',
  });
  const backlog = resumoBacklog([tarefa]);
  const grafico = montarGrafico({ dados: [backlog], afirmacao: `${backlog.realizadas} de ${backlog.total} tarefas realizadas`, destaque: 'pendentes', anotacoes: [] });
  const item = montarItem({ tarefa, bloco: { numero: '1.1', titulo: 'Problema' }, agora: '2026-09-07T00:00:00Z', papel: 'orientador' });
  const rastro = criarRastro({ perguntaPesquisa: 'Como registrar decisao?', objetivo: 'Descrever o mecanismo', blocoId: 'b2', evidencias: ['c1'] });

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="toolbar">
        <div>
          <p class="eyebrow">Fichario solo</p>
          <h1>Fichamento local-first</h1>
        </div>
        <input id="busca" value="${escapeHtml(filtro)}" placeholder="Buscar assunto ou obra" />
      </section>

      <section class="grid">
        <article class="panel span-2">
          <h2>Fonte</h2>
          <p>${escapeHtml(formatar(estado.fonte))}</p>
        </article>

        <article class="panel">
          <h2>Ficha</h2>
          ${fichas.map(cardFicha).join('')}
        </article>

        <article class="panel">
          <h2>Citacao</h2>
          <p>${escapeHtml(apresentar(estado.citacoes[0], { linhas: 1 }))}</p>
        </article>

        <article class="panel">
          <h2>Tags</h2>
          <div class="tags">${linhaDeTags(estado.tags).tags.map(cardTag).join('')}</div>
        </article>

        <article class="panel">
          <h2>Acervo</h2>
          <p>${importadas.length} importacao BibTeX aceita</p>
          <p>${duplicata.duplicada ? 'duplicata sugerida para mescla' : 'sem duplicata'}</p>
        </article>

        <article class="panel">
          <h2>Monografia</h2>
          <p>${sumario.map((s) => `${s.numero} ${s.titulo}`).join(' · ')}</p>
          <p>${gerarListaFiguras(estado.monografia)[0].rotulo}</p>
          <p>${gerarListaTabelas(estado.monografia)[0].rotulo}</p>
        </article>

        <article class="panel">
          <h2>Verificador</h2>
          <p>${verificacao.podeExportar && coerencia.podeExportar ? 'exportacao liberada pelo preset do Fichario' : 'ha bloqueios de exportacao'}</p>
          <p>${siglas.map((s) => s.sigla).join(', ')}</p>
        </article>

        <article class="panel">
          <h2>Progresso</h2>
          <p>${palavras} palavras · ${meta.percentual}% da meta curta</p>
          <p>${escapeHtml(grafico.alternativaTextual)}</p>
        </article>

        <article class="panel span-2">
          <h2>Orientacao solo</h2>
          <div class="ficha"><strong>${escapeHtml(item.capitulo)}</strong><span>${escapeHtml(item.comentario)}</span><small>${item.acoes.join(', ')}</small></div>
          <p>Rastro: ${escapeHtml(rastro.objetivo)} com ${rastro.evidencias.length} evidencia</p>
        </article>
      </section>
    </main>
  `;

  document.querySelector('#busca').addEventListener('input', (evento) => desenhar(evento.target.value));
}

function cardFicha(ficha) {
  const limite = validarLimite({ tipo: ficha.tipo, texto: ficha.assunto });
  return `<div class="ficha"><strong>${escapeHtml(ficha.assunto)}</strong><span>ordem ${ficha.ordemImpressao}</span><small>${limite.valido ? 'dentro do limite' : 'excede limite'}</small></div>`;
}

function cardTag(tag) {
  return `<span class="tag" style="color:${tag.corTexto};background:${tag.corFundo}">${escapeHtml(tag.texto)}</span>`;
}

function escapeHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

desenhar();
