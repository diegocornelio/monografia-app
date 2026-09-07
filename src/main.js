import './styles.css';
import { conferir } from './domain/abnt/coerencia.mjs';
import { formatar } from './domain/abnt/referencia.mjs';
import { extrairSiglas } from './domain/abnt/siglas.mjs';
import { verificar } from './domain/abnt/verificador.mjs';
import { avaliar } from './domain/acervo/dedup.mjs';
import { lerBibTeX } from './domain/acervo/importadores.mjs';
import { filtrar } from './domain/busca.mjs';
import { apresentar, criarCitacao } from './domain/citacao.mjs';
import { criarFicha } from './domain/ficha.mjs';
import { validarLimite } from './domain/limites.mjs';
import { gerarListaFiguras, gerarListaTabelas, gerarSumario } from './domain/monografia/listas.mjs';
import { contarPalavras, progresso } from './domain/monografia/metas.mjs';
import { criarRastro } from './domain/monografia/rastro.mjs';
import { criarTarefa, moverTarefa, resumoBacklog } from './domain/backlog.mjs';
import { criarTag, linhaDeTags } from './domain/tag.mjs';
import { montar as montarGrafico } from './ui/graficos/GraficoNarrado.mjs';

const CHAVE_ESTADO = 'fichario.estado.v1';
let filtroAtual = '';

const estadoInicial = {
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
    { id: 'ficha-1', ...criarFicha({ projetoId: 'p1', fonteId: 'f01', tipo: 'texto', assunto: 'Metodo cientifico', ordemImpressao: 1 }) },
  ],
  citacoes: [{ id: 'cit-1', ...criarCitacao({ fonteId: 'f01', texto: 'Trecho selecionado da obra', pagina: 43 }) }],
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
    citacoes: [{ id: 'cit-1', fonteId: 'f01', linhas: 1, pagina: 43 }],
    referencias: [{ fonteId: 'f01' }],
  },
};

const estado = carregarEstado();

function desenhar(filtro = filtroAtual) {
  filtroAtual = filtro;
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
  const figuras = gerarListaFiguras(estado.monografia);
  const tabelas = gerarListaTabelas(estado.monografia);
  const verificacao = verificar(estado.monografia);
  const siglas = extrairSiglas(estado.monografia.blocos);
  const coerencia = conferir({ citacoesNoTexto: estado.monografia.citacoes, referencias: estado.monografia.referencias });
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
  const rastro = criarRastro({ perguntaPesquisa: 'Como registrar decisao?', objetivo: 'Descrever o mecanismo', blocoId: 'b2', evidencias: estado.monografia.citacoes.map((c) => c.id) });

  document.querySelector('#app').innerHTML = `
    <main class="app-shell">
      <section class="toolbar">
        <div>
          <p class="eyebrow">Fichario solo</p>
          <h1>Fichamento editavel</h1>
        </div>
        <input id="busca" value="${escapeAttr(filtro)}" placeholder="Buscar assunto ou obra" />
      </section>

      <section class="grid">
        <article class="panel span-2">
          <h2>Fonte</h2>
          <p>${escapeHtml(formatar(estado.fonte))}</p>
        </article>

        <article class="panel">
          <h2>Nova ficha</h2>
          <form id="form-ficha" class="stack">
            <input name="assunto" placeholder="Assunto da ficha" required />
            <select name="tipo">
              <option value="texto">Texto</option>
              <option value="citacao">Citacao</option>
              <option value="bibliografico">Bibliografico</option>
              <option value="fichao">Fichao</option>
            </select>
            <button type="submit">Criar ficha</button>
          </form>
          <div class="lista">${fichas.map(cardFicha).join('')}</div>
        </article>

        <article class="panel">
          <h2>Nova citacao</h2>
          <form id="form-citacao" class="stack">
            <textarea name="texto" placeholder="Texto da citacao" required></textarea>
            <input name="pagina" placeholder="Pagina" required />
            <button type="submit">Criar citacao</button>
          </form>
          <div class="lista">${estado.citacoes.map(cardCitacao).join('')}</div>
        </article>

        <article class="panel">
          <h2>Tags</h2>
          <form id="form-tag" class="inline-form">
            <input name="texto" placeholder="Nova tag" required />
            <button type="submit">Adicionar</button>
          </form>
          <div class="tags">${linhaDeTags(estado.tags).tags.map(cardTag).join('')}</div>
        </article>

        <article class="panel">
          <h2>Acervo</h2>
          <p>${importadas.length} importacao BibTeX aceita</p>
          <p>${duplicata.duplicada ? 'duplicata sugerida para mescla' : 'sem duplicata'}</p>
        </article>

        <article class="panel span-2">
          <h2>Monografia</h2>
          <form id="form-bloco" class="section-form">
            <input name="titulo" placeholder="Titulo da nova secao" required />
            <textarea name="texto" placeholder="Texto inicial"></textarea>
            <button type="submit">Criar secao</button>
          </form>
          <div class="blocos">${estado.monografia.blocos.map(cardBloco).join('')}</div>
          <p class="muted">Sumario: ${sumario.map((s) => `${s.numero} ${s.titulo}`).join(' · ')}</p>
        </article>

        <article class="panel">
          <h2>Imagem</h2>
          <form id="form-figura" class="stack">
            ${selectBloco('blocoId')}
            <input name="legenda" placeholder="Legenda da figura" required />
            <input name="altText" placeholder="Texto alternativo" required />
            <button type="submit">Inserir imagem</button>
          </form>
          <div class="lista">${figuras.map((figura) => `<p>${escapeHtml(figura.rotulo)}</p>`).join('')}</div>
        </article>

        <article class="panel">
          <h2>Tabela</h2>
          <form id="form-tabela" class="stack">
            ${selectBloco('blocoId')}
            <input name="titulo" placeholder="Titulo da tabela" required />
            <button type="submit">Inserir tabela</button>
          </form>
          <div class="lista">${tabelas.map((tabela) => `<p>${escapeHtml(tabela.rotulo)}</p>`).join('')}</div>
        </article>

        <article class="panel">
          <h2>Verificador</h2>
          <p>${verificacao.podeExportar && coerencia.podeExportar ? 'exportacao liberada pelo preset do Fichario' : 'ha bloqueios de exportacao'}</p>
          <p>${siglas.map((s) => s.sigla).join(', ') || 'sem siglas novas'}</p>
        </article>

        <article class="panel">
          <h2>Progresso</h2>
          <p>${palavras} palavras · ${meta.percentual}% da meta curta</p>
          <p>${escapeHtml(grafico.alternativaTextual)}</p>
        </article>

        <article class="panel span-2">
          <h2>Orientacao solo</h2>
          <div class="ficha"><strong>Rastro</strong><span>${escapeHtml(rastro.objetivo)}</span><small>${rastro.evidencias.length} evidencia(s)</small></div>
        </article>
      </section>
    </main>
  `;

  conectarEventos();
}

function conectarEventos() {
  document.querySelector('#busca').addEventListener('input', (evento) => desenhar(evento.target.value));
  document.querySelector('#form-ficha').addEventListener('submit', criarNovaFicha);
  document.querySelector('#form-citacao').addEventListener('submit', criarNovaCitacao);
  document.querySelector('#form-tag').addEventListener('submit', criarNovaTag);
  document.querySelector('#form-bloco').addEventListener('submit', criarNovoBloco);
  document.querySelector('#form-figura').addEventListener('submit', criarNovaFigura);
  document.querySelector('#form-tabela').addEventListener('submit', criarNovaTabela);

  document.querySelectorAll('[data-subir]').forEach((botao) => botao.addEventListener('click', () => moverBloco(botao.dataset.subir, -1)));
  document.querySelectorAll('[data-descer]').forEach((botao) => botao.addEventListener('click', () => moverBloco(botao.dataset.descer, 1)));
  document.querySelectorAll('[data-texto-bloco]').forEach((campo) => {
    campo.addEventListener('change', () => atualizarTextoBloco(campo.dataset.textoBloco, campo.value));
    campo.addEventListener('dragover', (evento) => evento.preventDefault());
    campo.addEventListener('drop', (evento) => soltarCitacao(evento, campo.dataset.textoBloco));
  });
  document.querySelectorAll('[data-citacao]').forEach((cartao) => {
    cartao.addEventListener('dragstart', (evento) => evento.dataTransfer.setData('text/plain', cartao.dataset.citacao));
  });
}

function criarNovaFicha(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  estado.fichas.push({
    id: uid('ficha'),
    ...criarFicha({
      projetoId: 'p1',
      fonteId: estado.fonte.id,
      tipo: dados.tipo,
      assunto: dados.assunto,
      ordemImpressao: estado.fichas.length + 1,
    }),
  });
  persistir();
}

function criarNovaCitacao(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  estado.citacoes.push({ id: uid('cit'), ...criarCitacao({ fonteId: estado.fonte.id, texto: dados.texto, pagina: dados.pagina }) });
  persistir();
}

function criarNovaTag(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  estado.tags.push(criarTag({ texto: dados.texto, corTexto: '#2B2B2B', corFundo: '#E9F0DD' }));
  persistir();
}

function criarNovoBloco(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  estado.monografia.blocos.push({
    id: uid('b'),
    numero: String(estado.monografia.blocos.length + 1),
    titulo: dados.titulo,
    tipo: 'textual',
    pagina: 10 + estado.monografia.blocos.length + 1,
    texto: dados.texto || '',
  });
  renumerarBlocos();
  persistir();
}

function criarNovaFigura(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  estado.monografia.figuras.push({
    id: uid('fig'),
    blocoId: dados.blocoId,
    legenda: dados.legenda,
    fonte: 'autor',
    altText: dados.altText,
    pagina: paginaDoBloco(dados.blocoId),
  });
  persistir();
}

function criarNovaTabela(evento) {
  evento.preventDefault();
  const dados = Object.fromEntries(new FormData(evento.target));
  estado.monografia.tabelas.push({
    id: uid('tab'),
    blocoId: dados.blocoId,
    titulo: dados.titulo,
    fonte: 'autor',
    pagina: paginaDoBloco(dados.blocoId),
  });
  persistir();
}

function moverBloco(id, direcao) {
  const origem = estado.monografia.blocos.findIndex((bloco) => bloco.id === id);
  const destino = origem + direcao;
  if (origem < 0 || destino < 0 || destino >= estado.monografia.blocos.length) return;
  const [bloco] = estado.monografia.blocos.splice(origem, 1);
  estado.monografia.blocos.splice(destino, 0, bloco);
  renumerarBlocos();
  persistir();
}

function atualizarTextoBloco(id, texto) {
  const bloco = estado.monografia.blocos.find((item) => item.id === id);
  if (!bloco) return;
  bloco.texto = texto;
  persistir();
}

function soltarCitacao(evento, blocoId) {
  evento.preventDefault();
  const citacaoId = evento.dataTransfer.getData('text/plain');
  const citacao = estado.citacoes.find((item) => item.id === citacaoId);
  const bloco = estado.monografia.blocos.find((item) => item.id === blocoId);
  if (!citacao || !bloco) return;

  const trecho = apresentar(citacao, { linhas: 1 });
  bloco.texto = `${bloco.texto.trim()}\n\n${typeof trecho === 'string' ? trecho : trecho.texto}`.trim();
  if (!estado.monografia.citacoes.some((item) => item.id === citacao.id)) {
    estado.monografia.citacoes.push({ id: citacao.id, fonteId: citacao.fonteId, linhas: 1, pagina: citacao.pagina });
  }
  if (!estado.monografia.referencias.some((item) => item.fonteId === citacao.fonteId)) {
    estado.monografia.referencias.push({ fonteId: citacao.fonteId });
  }
  persistir();
}

function cardFicha(ficha) {
  const limite = validarLimite({ tipo: ficha.tipo, texto: ficha.assunto });
  return `<div class="ficha"><strong>${escapeHtml(ficha.assunto)}</strong><span>${escapeHtml(ficha.tipo)} · ordem ${ficha.ordemImpressao}</span><small>${limite.valido ? 'dentro do limite' : 'excede limite'}</small></div>`;
}

function cardCitacao(citacao) {
  return `<div class="citacao" draggable="true" data-citacao="${escapeAttr(citacao.id)}"><strong>p. ${escapeHtml(citacao.pagina)}</strong><span>${escapeHtml(apresentar(citacao, { linhas: 1 }))}</span></div>`;
}

function cardBloco(bloco, indice) {
  return `
    <section class="bloco">
      <div class="bloco-topo">
        <strong>${escapeHtml(bloco.numero)} ${escapeHtml(bloco.titulo)}</strong>
        <span>
          <button type="button" class="icon-button" data-subir="${escapeAttr(bloco.id)}" title="Subir secao">↑</button>
          <button type="button" class="icon-button" data-descer="${escapeAttr(bloco.id)}" title="Descer secao">↓</button>
        </span>
      </div>
      <textarea data-texto-bloco="${escapeAttr(bloco.id)}" aria-label="Texto da secao ${indice + 1}">${escapeHtml(bloco.texto)}</textarea>
    </section>
  `;
}

function cardTag(tag) {
  return `<span class="tag" style="color:${tag.corTexto};background:${tag.corFundo}">${escapeHtml(tag.texto)}</span>`;
}

function selectBloco(nome) {
  return `
    <select name="${nome}">
      ${estado.monografia.blocos.map((bloco) => `<option value="${escapeAttr(bloco.id)}">${escapeHtml(`${bloco.numero} ${bloco.titulo}`)}</option>`).join('')}
    </select>
  `;
}

function paginaDoBloco(id) {
  return estado.monografia.blocos.find((bloco) => bloco.id === id)?.pagina ?? 1;
}

function renumerarBlocos() {
  estado.monografia.blocos.forEach((bloco, indice) => {
    bloco.numero = String(indice + 1);
  });
}

function carregarEstado() {
  const salvo = localStorage.getItem(CHAVE_ESTADO);
  if (!salvo) return structuredClone(estadoInicial);
  return normalizarEstado(JSON.parse(salvo));
}

function normalizarEstado(valor) {
  valor.fichas = valor.fichas.map((ficha, indice) => ({ id: ficha.id ?? uid('ficha'), ordemImpressao: indice + 1, ...ficha }));
  valor.citacoes = valor.citacoes.map((citacao) => ({ id: citacao.id ?? uid('cit'), ...citacao }));
  return valor;
}

function persistir() {
  localStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado));
  desenhar();
}

function uid(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(valor) {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(valor) {
  return escapeHtml(valor).replaceAll("'", '&#39;');
}

desenhar();
